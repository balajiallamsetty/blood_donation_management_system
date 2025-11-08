const Request = require("../models/Request");
const Inventory = require("../models/Inventory");
const Hospital = require("../models/Hospital");
const { broadcast } = require("../utils/sse");

// 🩸 Create Blood Request
exports.createRequest = async (req, res) => {
  try {
    const {
      bloodGroup,
      rh,
      unitsNeeded,
      urgency,
      location,
      hospitalId,
      hospitalName,
      contact,
      patientName,
      notes
    } = req.body;

    // ✅ 1. Validate required fields
    if (!bloodGroup || !unitsNeeded || !location || !location.lat || !location.lng) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ 2. Resolve hospital name if ID is given
    let hospitalNameVal = hospitalName || null;
    if (hospitalId && !hospitalNameVal) {
      const hosp = await Hospital.findById(hospitalId);
      if (hosp) hospitalNameVal = hosp.name;
    }

    // ✅ 3. Create document with defaults for missing optional fields
    const requestData = {
      requester: req.user.id,
      bloodType: bloodGroup,
      units: unitsNeeded,
      location: {
        lat: location.lat,
        lng: location.lng,
      },
      hospitalName: hospitalNameVal || "Unknown Facility",
      patientName: patientName || "Anonymous",
      contact: contact || "N/A",
      urgency: urgency ? urgency.toLowerCase() : "normal",
      notes: notes || "",
      status: "open"
    };

  const reqDoc = await Request.create(requestData);

  // ✅ 4. Populate requester info for richer response
  const populatedReq = await reqDoc.populate("requester", "name email bloodGroup");

  // 🔔 Broadcast create event
  try { broadcast('request.created', populatedReq); } catch (_e) {}

  return res.status(201).json(populatedReq);
  } catch (err) {
    console.error("❌ Error creating request:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// 🩸 Get All Requests
exports.getRequests = async (req, res) => {
  try {
    const list = await Request.find()
      .populate("requester", "name email bloodGroup")
      .sort({ createdAt: -1 });
    // Dev convenience: disable caching to avoid 304 confusion
    res.set('Cache-Control', 'no-store');
    res.status(200).json(list);
  } catch (err) {
    console.error("❌ Error fetching requests:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🩸 Get Request by ID
exports.getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ message: 'Invalid request id' });
    }
    const r = await Request.findById(id).populate(
      "requester",
      "name email bloodGroup"
    );
    if (!r) return res.status(404).json({ message: "Not found" });
    res.status(200).json(r);
  } catch (err) {
    console.error("❌ Error fetching request by ID:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🩸 Update Request Status (open / fulfilled / cancelled)
exports.patchStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const r = await Request.findById(req.params.id);
    if (!r) return res.status(404).json({ message: "Not found" });

    // 🔒 Restrict fulfillment updates
    if (
      status === "fulfilled" &&
      !(req.user.role === "donor" || String(r.requester) === String(req.user.id))
    ) {
      return res.status(403).json({
        message: "Only donors or the original requester may fulfill this request"
      });
    }

    r.status = status;
    await r.save();

  const updatedReq = await r.populate("requester", "name email bloodGroup");
  // 🔔 Broadcast update event
  try { broadcast('request.updated', updatedReq); } catch (_e) {}
  res.status(200).json(updatedReq);
  } catch (err) {
    console.error("❌ Error updating status:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🩸 Fulfill Request (hospital reduces inventory)
exports.fulfill = async (req, res) => {
  try {
    const { hospitalId, units } = req.body;
    const item = await Inventory.findOne({
      hospital: hospitalId,
      units: { $gte: units }
    });

    if (!item)
      return res.status(400).json({ message: "Not enough inventory available" });

    item.units -= units;
    await item.save();

    const r = await Request.findById(req.params.id);
    if (!r) return res.status(404).json({ message: "Request not found" });

    r.status = "fulfilled";
    await r.save();

    const populatedReq = await r.populate("requester", "name email bloodGroup");
    // 🔔 Broadcast fulfilled event
    try { broadcast('request.fulfilled', populatedReq); } catch (_e) {}
    res.status(200).json({
      message: "Request fulfilled successfully",
      request: populatedReq
    });
  } catch (err) {
    console.error("❌ Error fulfilling request:", err);
    res.status(500).json({ message: "Server error" });
  }
};
