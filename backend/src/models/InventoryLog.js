const mongoose = require('mongoose');

// Records each mutating inventory action for audit/history
// For full traceability you would also link to user performing the action; kept minimal here.
const inventoryLogSchema = new mongoose.Schema({
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  bloodGroup: { type: String, required: true },
  rh: { type: String, enum: ['+','-'], required: true },
  action: { type: String, enum: ['replace','adjust'], required: true },
  deltaUnits: { type: Number, required: true }, // for replace this is new total; for adjust it's +/- diff
  previousUnits: { type: Number },
  newUnits: { type: Number },
  at: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);