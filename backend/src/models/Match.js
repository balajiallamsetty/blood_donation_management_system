const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true },
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  distanceKm: { type: Number },
  score: { type: Number, default: 0 },
  unitsAvailable: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Match', matchSchema);
