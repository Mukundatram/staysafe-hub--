const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  documentType: { 
    type: String, 
    enum: [
      // Student Identity Documents
      'student_id',           // Student ID card
      'college_id',           // College/University ID
      
      // General Identity Documents
      'aadhar',               // Aadhar card
      'pan',                  // PAN card
      'passport',             // Passport
      'driving_license',      // Driving License
      
      // Address Proof Documents
      'utility_bill',         // Utility bill (electricity, water, gas)
      'bank_statement',       // Bank statement
      'rent_agreement',       // Rent agreement
      
      // Property Owner Documents
      'property_deed',        // Property deed
      'property_tax',         // Property tax receipt
      'ownership_certificate', // Property ownership certificate
      'noc',                  // No Objection Certificate
      'encumbrance_certificate', // Encumbrance certificate
      
      // Other
      'other'                 // Other documents
    ],
    required: true 
  },
  documentCategory: {
    type: String,
    enum: ['identity', 'address', 'property', 'other'],
    required: true
  },
  fileName: { 
    type: String, 
    required: true 
  },
  originalName: { 
    type: String, 
    required: true 
  },
  filePath: { 
    type: String, 
    required: true 
  },
  fileSize: { 
    type: Number, 
    required: true 
  },
  mimeType: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'under_review', 'verified', 'rejected'],
    default: 'pending' 
  },
  verifiedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  verifiedAt: { 
    type: Date 
  },
  rejectionReason: { 
    type: String 
  },
  notes: { 
    type: String 
  },
  expiryDate: { 
    type: Date 
  },
  property: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Property' 
  }
}, { timestamps: true });

// Indexes for efficient queries
documentSchema.index({ user: 1, documentType: 1 });
documentSchema.index({ user: 1, status: 1 });
documentSchema.index({ status: 1 });

module.exports = mongoose.model('Document', documentSchema);
