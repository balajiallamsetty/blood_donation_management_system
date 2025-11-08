const Hospital = require('../models/Hospital');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.createHospital = async (req, res) => {
  try {
    const { name, address, location } = req.body;
    const owner = req.user.id;
    const h = new Hospital({ owner, name, address, location });
    await h.save();
    res.status(201).json(h);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getHospital = async (req, res) => {
  try {
    const h = await Hospital.findById(req.params.id).populate('owner', 'name email');
    if (!h) return res.status(404).json({ message: 'Not found' });
    res.json(h);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /hospitals/me - get hospital for current authenticated owner
exports.getMyHospital = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    // Basic validation of JWT payload presence
    if (!userId) {
      return res.status(400).json({ message: 'Missing user id in token' });
    }
    // Validate ObjectId format (avoids mongoose CastError -> 500)
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      return res.status(400).json({ message: 'Invalid user id format' });
    }
    console.log('[getMyHospital] userId:', userId);
    const h = await Hospital.findOne({ owner: userId }).populate('owner', 'name email');
    if (!h) {
      console.log('[getMyHospital] No hospital doc for owner');
      return res.status(404).json({ message: 'Hospital for this owner not found' });
    }
    console.log('[getMyHospital] Found hospital id:', h._id.toString());
    res.json(h);
  } catch (err) {
    // Provide more granular logging to help diagnose 500s
    console.error('[getMyHospital] Error:', err.name, err.message);
    // Surface error message only in development for easier debugging
    const payload = { message: 'Server error' };
    if (process.env.NODE_ENV !== 'production') payload.error = err.message;
    res.status(500).json(payload);
  }
};

exports.updateHospital = async (req, res) => {
  try {
    const updates = (({ name, address, location }) => ({ name, address, location }))(req.body);
    const h = await Hospital.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(h);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addCamp = async (req, res) => {
  try {
    const { title, date, location, notes } = req.body;
    const h = await Hospital.findById(req.params.id);
    if (!h) return res.status(404).json({ message: 'Not found' });
    h.camps.push({ title, date, location, notes });
    await h.save();
    res.status(201).json(h.camps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCamps = async (req, res) => {
  try {
    const h = await Hospital.findById(req.params.id);
    if (!h) return res.status(404).json({ message: 'Not found' });
    res.json(h.camps || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /hospitals/:id/password  body: { currentPassword, newPassword }
// Owner (hospital admin) or system admin may rotate password. Owner must supply currentPassword.
exports.updateHospitalPassword = async (req, res) => {
  try {
    let { id } = req.params;
    // Allow fallback usage of '/hospitals/me/password' hitting the parameter route if order changes
    if (id === 'me') {
      // Replace with the hospital document id by finding hospital for current owner
      const ownerHospital = await Hospital.findOne({ owner: req.user.id });
      if (!ownerHospital) return res.status(404).json({ message: 'Hospital for current user not found' });
      id = ownerHospital._id.toString();
    }
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }
    const hospital = await Hospital.findById(id);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    // Load owner user
    const ownerUser = await User.findById(hospital.owner);
    if (!ownerUser) return res.status(404).json({ message: 'Owner user not found' });
    const requesterRole = req.user.role;
    const requesterId = req.user.id;
    const isOwner = requesterId === hospital.owner.toString();
    const isAdmin = requesterRole === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // If owner initiating change, require current password validation
    if (isOwner && !isAdmin) {
      if (!currentPassword) return res.status(400).json({ message: 'Current password required' });
      const match = await bcrypt.compare(currentPassword, ownerUser.password);
      if (!match) return res.status(400).json({ message: 'Current password incorrect' });
    }
    const salt = await bcrypt.genSalt(10);
    ownerUser.password = await bcrypt.hash(newPassword, salt);
    await ownerUser.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('updateHospitalPassword error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /hospitals/me/password (hospital owner only)
// body: { currentPassword, newPassword }
exports.updateMyHospitalPassword = async (req, res) => {
  try {
    if (req.user.role !== 'hospital') return res.status(403).json({ message: 'Forbidden' });
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Missing fields' });
    if (newPassword.length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters' });
    const hospital = await Hospital.findOne({ owner: req.user.id });
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    const ownerUser = await User.findById(hospital.owner);
    if (!ownerUser) return res.status(404).json({ message: 'Owner user not found' });
    const match = await bcrypt.compare(currentPassword, ownerUser.password);
    if (!match) return res.status(400).json({ message: 'Current password incorrect' });
    const salt = await bcrypt.genSalt(10);
    ownerUser.password = await bcrypt.hash(newPassword, salt);
    await ownerUser.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('updateMyHospitalPassword error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
