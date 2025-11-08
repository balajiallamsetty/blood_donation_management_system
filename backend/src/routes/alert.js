const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");

// Temporary alerts route
router.get("/", verifyToken, (req, res) => {
  res.json([
    { id: 1, message: "Your last donation was verified ✅" },
    { id: 2, message: "Upcoming blood camp near you on Nov 10 🩸" },
  ]);
});

module.exports = router;
