const mongoose = require('mongoose');

const VerificationAuditSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true }, // request_email, verify_email, admin_approve_email, admin_reject_email
  reason: { type: String },
  docId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  providerRef: { type: String },
  token: { type: String },
  ip: { type: String },
  userAgent: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('VerificationAudit', VerificationAuditSchema);
