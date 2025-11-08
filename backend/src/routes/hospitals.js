const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requireRole, requireOwnerOrRole } = require('../middleware/roles');
const { createHospital, getHospital, getMyHospital, updateHospital, addCamp, getCamps, updateHospitalPassword, updateMyHospitalPassword } = require('../controllers/hospitalsController');
// Get my hospital (owner)
router.get('/me', verifyToken, requireRole(['hospital','admin']), getMyHospital);
const Hospital = require('../models/Hospital');


// Get hospital public
router.get('/:id', getHospital);

// Update hospital (owner or admin)
router.put('/:id', verifyToken, requireOwnerOrRole(async (req) => {
  const h = await Hospital.findById(req.params.id);
  return h ? h.owner : null;
}, ['admin']), updateHospital);

// Camps
router.post('/:id/camps', verifyToken, requireOwnerOrRole(async (req) => {
  const h = await Hospital.findById(req.params.id);
  return h ? h.owner : null;
}, ['admin','hospital']), addCamp);

router.get('/:id/camps', getCamps);

// Password update for current hospital owner (no id required)
router.patch('/me/password', verifyToken, requireRole(['hospital']), updateMyHospitalPassword);

// Password update (owner or admin) - owner must provide current password
router.patch('/:id/password', verifyToken, requireOwnerOrRole(async (req) => {
  // Handle 'me' safely before any DB calls
  if (req.params.id === 'me') {
    // Owner is the currently authenticated user
    return req.user.id;
  }
  const h = await Hospital.findById(req.params.id);
  return h ? h.owner : null;
}, ['admin']), updateHospitalPassword);

module.exports = router;
