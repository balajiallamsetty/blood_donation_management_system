const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientName: { type: String },
  hospitalName: { type: String },
  bloodType: { type: String, required: true },
  units: { type: Number, required: true },

  // ✅ FIXED: store lat/lng as separate numbers
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },

  urgency: { type: String, enum: ['critical', 'urgent', 'normal'], default: 'normal' },
  status: { type: String, enum: ['open', 'fulfilled', 'cancelled'], default: 'open' },
  contact: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Index for status queries in audit
requestSchema.index({ status: 1 });

module.exports = mongoose.model('Request', requestSchema);
