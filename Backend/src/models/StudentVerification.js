const mongoose = require('mongoose');

const StudentVerificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true },
  domain: { type: String },
  token: { type: String, required: true, unique: true },
  verified: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('StudentVerification', StudentVerificationSchema);
