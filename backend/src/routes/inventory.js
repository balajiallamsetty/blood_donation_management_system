const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requireRole, requireOwnerOrRole } = require('../middleware/roles');
const { getInventory, replaceInventory, patchItem, getLogs, getExpiry } = require('../controllers/inventoryController');
const Hospital = require('../models/Hospital');

// Get inventory public
router.get('/:hospitalId', getInventory);

// Replace inventory (hospital owner or admin)
router.put('/:hospitalId', verifyToken, requireOwnerOrRole(async (req) => {
  const h = await Hospital.findById(req.params.hospitalId);
  return h ? h.owner : null;
}, ['admin']), replaceInventory);

// Patch an item (hospital owner or admin)
router.patch('/:hospitalId/item', verifyToken, requireOwnerOrRole(async (req) => {
  const h = await Hospital.findById(req.params.hospitalId);
  return h ? h.owner : null;
}, ['admin']), patchItem);

// Logs (owner or admin)
router.get('/:hospitalId/logs', verifyToken, requireOwnerOrRole(async (req) => {
  const h = await Hospital.findById(req.params.hospitalId);
  return h ? h.owner : null;
}, ['admin']), getLogs);

// Expiry (public for view, could restrict later)
router.get('/:hospitalId/expiry', getExpiry);

module.exports = router;
