const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const {
  createHospital,
  getHospitals,
  pendingHospitals,
  pendingDonors,
  patchDonor,
  audit,
  pendingDonations,
  verifyDonation,
  overview,
} = require('../controllers/adminController');

// ✅ Protect all admin routes
router.use(verifyToken, requireRole('admin'));

// 🏥 Hospitals
router.get('/hospitals', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, getHospitals);
router.post('/hospitals', createHospital);
// ❌ Removed: router.patch('/hospitals/:id', patchHospital);
// Re-added pending hospitals endpoint to match frontend usage
router.get('/pending-hospitals', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, pendingHospitals);

// 🩸 Donors
router.get('/pending-donors', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, pendingDonors);
router.patch('/donors/:userId', patchDonor);

// 💉 Donations
router.get('/pending-donations', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, pendingDonations);
router.patch('/donations/:donationId', verifyDonation);

// 📊 Audit
router.get('/audit', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, audit);
router.get('/overview', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, overview);

module.exports = router;
