const Match = require('../models/Match');
const User = require('../models/User');
const Request = require('../models/Request');

function haversineKm(a, b) {
  const toRad = x => x * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const aa = Math.sin(dLat/2)**2 + Math.sin(dLon/2)**2 * Math.cos(lat1)*Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1-aa));
  return R * c;
}

// POST /requests/:id/match (ADMIN)
exports.runMatches = async (req, res) => {
  try {
    const reqDoc = await Request.findById(req.params.id);
    if (!reqDoc) return res.status(404).json({ message: 'Not found' });
    // very simple: match donors of same bloodGroup within 50km
    const donors = await User.find({ role: 'donor', bloodGroup: reqDoc.bloodType, isVerified: true }).select('-password');
    const origin = reqDoc.location || { lat: 0, lng: 0 };
    const matches = [];
    for (const d of donors) {
      if (!d.location || d.location.lat == null) continue;
      const dist = haversineKm(origin, { lat: d.location.lat, lng: d.location.lng });
      if (dist <= 50) {
        matches.push({ request: reqDoc._id, donor: d._id, distanceKm: dist, unitsAvailable: 1, score: 1/(1+dist) });
      }
    }
    // remove old matches
    await Match.deleteMany({ request: reqDoc._id });
    const created = await Match.insertMany(matches);
    res.json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /requests/:id/matches
exports.getMatches = async (req, res) => {
  try {
    const list = await Match.find({ request: req.params.id }).populate('donor', 'name email bloodGroup location');
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
