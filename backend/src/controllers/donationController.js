const mongoose = require("mongoose");
const Donation = require("../models/Donation");

// 🩸 Donor submits a new donation (pending verification)
exports.recordDonation = async (req, res) => {
  try {
    const donorId = req.user.id; // from JWT - comes as string
    const { units, location, hospital } = req.body;

    console.log("📝 recordDonation called with:", {
      donorId,
      donorIdType: typeof donorId,
      units,
      location,
      hospital,
    });

    // ✅ Basic validation
    if (!units || isNaN(units) || units <= 0) {
      return res.status(400).json({ message: "Please provide a valid number of units donated." });
    }

    // ✅ Ensure donorId is converted to ObjectId if it's a valid string
    let convertedDonorId = donorId;
    if (typeof donorId === "string" && mongoose.Types.ObjectId.isValid(donorId)) {
      convertedDonorId = new mongoose.Types.ObjectId(donorId);
    }

    const donationPayload = {
      donor: convertedDonorId,
      units,
      location: location || "Not specified",
      status: "pending",
      verified: false,
    };

    // ✅ Handle both hospital ObjectId and plain string
    if (hospital) {
      if (mongoose.Types.ObjectId.isValid(hospital)) {
        donationPayload.hospital = new mongoose.Types.ObjectId(hospital);
      } else if (typeof hospital === "string" && hospital.trim() !== "") {
        donationPayload.hospitalName = hospital.trim();
      }
    }

    console.log("📦 Final donation payload:", donationPayload);

    // ✅ Create donation entry
    const donation = await Donation.create(donationPayload);

    console.log("✅ Donation created successfully:", donation._id);

    res.status(201).json({
      message: "Donation recorded successfully and pending verification.",
      donation,
    });
  } catch (err) {
    console.error("❌ Error recording donation:", {
      name: err?.name,
      message: err?.message,
      stack: err?.stack,
    });
    const status = err?.name === "ValidationError" ? 400 : 500;
    res.status(status).json({
      message: err?.message || "Failed to record donation",
    });
  }
};

// 🧾 Get donation history for logged-in donor
exports.getDonationHistory = async (req, res) => {
  try {
    const donorId = req.user.id;
    const history = await Donation.find({ donor: donorId })
      .populate("hospital", "name address")
      .sort({ date: -1 });

    if (!history.length) {
      return res.status(200).json([]);
    }

    res.json(history);
  } catch (err) {
    console.error("❌ Error fetching donation history:", err);
    res.status(500).json({ message: "Failed to fetch donation history" });
  }
};

// ✅ Verify a donation (only admin or hospital can do this)
exports.verifyDonation = async (req, res) => {
  try {
    const donationId = req.params.id;
    const user = req.user; // from JWT middleware

    // ✅ Role restriction
    if (user.role !== "admin" && user.role !== "hospital") {
      return res.status(403).json({ message: "Not authorized to verify donations." });
    }

    const donation = await Donation.findByIdAndUpdate(
      donationId,
      {
        verified: true,
        verifiedBy: user.id,
        verifiedAt: new Date(),
        status: "completed",
      },
      { new: true }
    )
      .populate("donor", "name email bloodGroup")
      .populate("hospital", "name");

    if (!donation) {
      return res.status(404).json({ message: "Donation not found." });
    }

    res.json({
      message: "Donation verified successfully.",
      donation,
    });
  } catch (err) {
    console.error("❌ Error verifying donation:", err);
    res.status(500).json({ message: "Verification failed." });
  }
};
