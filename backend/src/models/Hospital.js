const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  address: { type: String },
  location: { lat: Number, lng: Number },
  camps: [
    {
      title: String,
      date: Date,
      location: { lat: Number, lng: Number },
      notes: String
    }
  ],
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Index for verified filter
hospitalSchema.index({ verified: 1 });

module.exports = mongoose.model('Hospital', hospitalSchema);
