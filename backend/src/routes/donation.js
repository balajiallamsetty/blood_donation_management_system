const express = require("express");
const router = express.Router();
const { verifyToken, verifyDonor } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const {
  recordDonation,
  getDonationHistory,
  verifyDonation,
} = require("../controllers/donationController");

// Donor: Record donation (pending verification)
router.post("/record", verifyDonor, recordDonation);

// Donor: Get donation history
router.get("/me/history", verifyDonor, getDonationHistory);

// Admin/Hospital: Verify donation
router.patch(
  "/:id/verify",
  verifyToken,
  requireRole(["admin", "hospital"]),
  verifyDonation
);

module.exports = router;
