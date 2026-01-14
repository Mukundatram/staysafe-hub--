const mongoose = require('mongoose');

const agreementSchema = new mongoose.Schema({
  booking: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Booking', 
    required: true 
  },
  property: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Property', 
    required: true 
  },
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Agreement Details
  agreementNumber: {
    type: String,
    unique: true,
    required: true
  },
  agreementType: {
    type: String,
    enum: ['rental', 'pg', 'hostel', 'mess'],
    default: 'rental'
  },
  
  // Terms
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  monthlyRent: { 
    type: Number, 
    required: true 
  },
  securityDeposit: { 
    type: Number, 
    required: true 
  },
  maintenanceCharges: { 
    type: Number, 
    default: 0 
  },
  
  // Additional Terms
  terms: [{
    title: String,
    description: String
  }],
  
  // Included Services
  includedServices: [{
    type: String
  }],
  
  // Rules
  rules: [{
    type: String
  }],
  
  // Notice Period
  noticePeriod: {
    type: Number,
    default: 30,
    description: 'Notice period in days'
  },
  
  // Signatures
  studentSignature: {
    signed: { type: Boolean, default: false },
    signedAt: Date,
    ipAddress: String,
    userAgent: String,
    signatureData: String // Base64 signature image or text
  },
  ownerSignature: {
    signed: { type: Boolean, default: false },
    signedAt: Date,
    ipAddress: String,
    userAgent: String,
    signatureData: String
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'pending_student', 'pending_owner', 'active', 'expired', 'terminated', 'cancelled'],
    default: 'draft'
  },
  
  // PDF Generation
  pdfPath: String,
  pdfGeneratedAt: Date,
  
  // Termination
  terminatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  terminationReason: String,
  terminationDate: Date,
  
  // Notes
  notes: String
  
}, { timestamps: true });

// Generate unique agreement number
agreementSchema.pre('save', async function(next) {
  if (!this.agreementNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.agreementNumber = `SSH-${year}${month}-${random}`;
  }
  next();
});

// Indexes
agreementSchema.index({ booking: 1 });
agreementSchema.index({ student: 1 });
agreementSchema.index({ owner: 1 });
agreementSchema.index({ property: 1 });
agreementSchema.index({ status: 1 });
// Note: agreementNumber index is already created by unique: true

module.exports = mongoose.model('Agreement', agreementSchema);
