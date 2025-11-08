const express = require('express');
const router = express.Router();
const { verifyDonor } = require('../middleware/auth');
const { getMe, updateMe, getNearby } = require('../controllers/donorsController');

// 🧠 Donor-only routes
router.get('/me', verifyDonor, getMe);
router.put('/me', verifyDonor, updateMe);
router.get('/nearby', verifyDonor, getNearby);

module.exports = router;
