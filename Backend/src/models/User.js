const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['student','owner','admin'], required: true },
  phone: { type: String },
  phoneVerified: { type: Boolean, default: false },
  phoneVerifiedAt: Date,
  avatar: { type: String },
  
  // Verification status
  verificationStatus: {
    identity: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' }
    },
    address: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' }
    },
    isFullyVerified: { type: Boolean, default: false }
  },

  // Overall verification state (high-level): used for UI and booking gating
  verificationState: {
    type: String,
    enum: [
      'unverified',
      'email_verified',
      'document_uploaded',
      'verified_student',
      'verified_intern',
      'aadhaar_verified',
      'verification_failed'
    ],
    default: 'unverified'
  },

  // Aadhaar verification metadata (do NOT store Aadhaar number or OTP)
  aadhaarVerification: {
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    providerRef: String
  },
  
  // For students - college info
  college: { type: String },
  studentId: { type: String },
  
  // For owners - property ownership verification
  propertyVerification: {
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' }
  }
}, { timestamps: true });

// Update fully verified status
userSchema.pre('save', function(next) {
  if (this.verificationStatus) {
    this.verificationStatus.isFullyVerified = 
      this.verificationStatus.identity?.verified && 
      this.verificationStatus.address?.verified;
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
