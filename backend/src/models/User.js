const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['donor', 'hospital', 'admin'], default: 'donor' },
  bloodGroup: { type: String },
  phone: { type: String },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    label: { type: String }
  },
  isVerified: { type: Boolean, default: false },
  pendingApproval: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Indexes for faster admin queries
userSchema.index({ role: 1, isVerified: 1 });
// Note: `unique: true` on the email path already creates a unique index.
// Avoid declaring a duplicate simple index on { email: 1 } to prevent Mongoose warnings.

module.exports = mongoose.model('User', userSchema);
