const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // 🏥 Either store a Hospital ObjectId (if exists) OR a plain name
  hospital: {
    type: mongoose.Schema.Types.Mixed, // ✅ allows ObjectId or String safely
  },

  // 🩸 Always store hospital name for clarity (for manual entries)
  hospitalName: {
    type: String,
    trim: true,
  },

  date: {
    type: Date,
    default: Date.now,
  },

  units: {
    type: Number,
    required: true,
    min: [1, "Units must be at least 1"],
  },

  location: {
    type: String,
    trim: true,
  },

  status: {
    type: String,
    enum: ["pending", "completed", "cancelled"],
    default: "pending",
  },

  verified: {
    type: Boolean,
    default: false,
  },

  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // admin or hospital staff
  },

  verifiedAt: {
    type: Date,
  },
});

// Indexes to speed status and donor lookups
donationSchema.index({ status: 1 });
donationSchema.index({ donor: 1, status: 1 });

// ✅ Optional: ensure clean hospital display
donationSchema.virtual("hospitalDisplay").get(function () {
  if (typeof this.hospital === "string") return this.hospital;
  if (this.hospitalName) return this.hospitalName;
  return "Unknown Hospital";
});

module.exports = mongoose.model("Donation", donationSchema);
