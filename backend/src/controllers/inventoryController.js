const Inventory = require('../models/Inventory');
const Hospital = require('../models/Hospital');
const InventoryLog = require('../models/InventoryLog');

// Allowed blood groups (without RH)
const ALLOWED_BLOOD_GROUPS = ['A','B','O','AB'];

// Helper to validate a full item
function validateItem(it) {
  if (!it) return 'Missing item';
  const { bloodGroup, rh, units } = it;
  if (!bloodGroup || !ALLOWED_BLOOD_GROUPS.includes(bloodGroup)) return 'Invalid bloodGroup';
  if (!rh || !['+','-'].includes(rh)) return 'Invalid rh';
  if (units == null || typeof units !== 'number' || units < 0) return 'Invalid units (must be >= 0)';
  return null;
}

// GET /inventory/:hospitalId
exports.getInventory = async (req, res) => {
  try {
    const list = await Inventory.find({ hospital: req.params.hospitalId });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /inventory/:hospitalId body: [ { bloodGroup, rh, units } ]
exports.replaceInventory = async (req, res) => {
  try {
    const hospitalId = req.params.hospitalId;
    const items = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ message: 'Array expected' });

    // Validate each item
    const seen = new Set();
    for (const it of items) {
      const err = validateItem(it);
      if (err) return res.status(400).json({ message: err });
      const key = `${it.bloodGroup}${it.rh}`;
      if (seen.has(key)) return res.status(400).json({ message: `Duplicate entry for ${key}` });
      seen.add(key);
    }

    // Remove existing
    await Inventory.deleteMany({ hospital: hospitalId });
    const toInsert = items.map(it => ({ hospital: hospitalId, bloodGroup: it.bloodGroup, rh: it.rh, units: it.units }));
    await Inventory.insertMany(toInsert);
    const list = await Inventory.find({ hospital: hospitalId });
    // Log replace events (store new total per item)
    for (const rec of list) {
      await InventoryLog.create({
        hospital: hospitalId,
        bloodGroup: rec.bloodGroup,
        rh: rec.rh,
        action: 'replace',
        deltaUnits: rec.units,
        previousUnits: null,
        newUnits: rec.units
      });
    }
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /inventory/:hospitalId/item body: { bloodGroup, rh, deltaUnits }
exports.patchItem = async (req, res) => {
  try {
    const { bloodGroup, rh, deltaUnits } = req.body;
    if (!bloodGroup || !rh || typeof deltaUnits !== 'number') return res.status(400).json({ message: 'Invalid body' });
    if (!ALLOWED_BLOOD_GROUPS.includes(bloodGroup) || !['+','-'].includes(rh)) return res.status(400).json({ message: 'Invalid group/rh' });
    const q = { hospital: req.params.hospitalId, bloodGroup, rh };
    const item = await Inventory.findOne(q);
    if (!item) {
      if (deltaUnits < 0) return res.status(400).json({ message: 'Cannot create item with negative units' });
      const created = await Inventory.create({ hospital: req.params.hospitalId, bloodGroup, rh, units: deltaUnits });
      await InventoryLog.create({
        hospital: req.params.hospitalId,
        bloodGroup,
        rh,
        action: 'adjust',
        deltaUnits,
        previousUnits: 0,
        newUnits: deltaUnits
      });
      return res.json(created);
    }
    const nextUnits = (item.units || 0) + deltaUnits;
    if (nextUnits < 0) return res.status(400).json({ message: 'Resulting units would be negative' });
    item.units = nextUnits;
    item.updatedAt = Date.now();
    await item.save();
    await InventoryLog.create({
      hospital: req.params.hospitalId,
      bloodGroup,
      rh,
      action: 'adjust',
      deltaUnits,
      previousUnits: (item.units - deltaUnits),
      newUnits: item.units
    });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /inventory/:hospitalId/logs?limit=50
exports.getLogs = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const logs = await InventoryLog.find({ hospital: hospitalId }).sort({ at: -1 }).limit(limit);
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /inventory/:hospitalId/expiry - naive expiry projection (FIFO not tracked yet)
// For now: mark all items with synthetic expiry 42 days after updatedAt
exports.getExpiry = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const list = await Inventory.find({ hospital: hospitalId });
    const now = Date.now();
    const data = list.map(i => {
      const updated = i.updatedAt ? i.updatedAt.getTime() : now;
      const expiryMs = updated + 42 * 24 * 60 * 60 * 1000; // 42 days shelf life placeholder
      const remainingDays = Math.max(0, Math.ceil((expiryMs - now) / (24*60*60*1000)));
      let status = 'ok';
      if (remainingDays <= 7) status = 'warning';
      if (remainingDays <= 2) status = 'critical';
      return {
        bloodGroup: i.bloodGroup,
        rh: i.rh,
        units: i.units,
        remainingDays,
        status,
        expiryDate: new Date(expiryMs)
      };
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
