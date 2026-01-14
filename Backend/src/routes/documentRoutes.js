const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `doc-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Get document category based on type
const getDocumentCategory = (docType) => {
  const categories = {
    student_id: 'identity',
    college_id: 'identity',
    aadhar: 'identity',
    pan: 'identity',
    passport: 'identity',
    driving_license: 'identity',
    property_ownership: 'property',
    property_tax: 'property',
    electricity_bill: 'address',
    rental_agreement: 'property',
    noc: 'property',
    other: 'other'
  };
  return categories[docType] || 'other';
};

// Upload a document
router.post('/upload', authenticate, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const { documentType, notes, propertyId, expiryDate } = req.body;

    if (!documentType) {
      // Delete uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        success: false, 
        message: 'Document type is required' 
      });
    }

    const document = new Document({
      user: req.user.id,
      documentType,
      documentCategory: getDocumentCategory(documentType),
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: `/uploads/documents/${req.file.filename}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      notes,
      property: propertyId || undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined
    });

    await document.save();

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      document
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload document' 
    });
  }
});

// Get user's documents
router.get('/my-documents', authenticate, async (req, res) => {
  try {
    const documents = await Document.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      documents
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch documents' 
    });
  }
});

// Get user's verification status
router.get('/verification-status', authenticate, async (req, res) => {
  try {
    const documents = await Document.find({ user: req.user.id });
    
    const identityDocs = documents.filter(d => d.documentCategory === 'identity');
    const addressDocs = documents.filter(d => d.documentCategory === 'address');
    const propertyDocs = documents.filter(d => d.documentCategory === 'property');

    const hasVerifiedIdentity = identityDocs.some(d => d.status === 'verified');
    const hasVerifiedAddress = addressDocs.some(d => d.status === 'verified');
    const hasVerifiedProperty = propertyDocs.some(d => d.status === 'verified');

    const pendingCount = documents.filter(d => d.status === 'pending' || d.status === 'under_review').length;
    const verifiedCount = documents.filter(d => d.status === 'verified').length;
    const rejectedCount = documents.filter(d => d.status === 'rejected').length;

    let overallStatus = 'not_verified';
    if (verifiedCount > 0 && pendingCount === 0 && rejectedCount === 0) {
      overallStatus = 'verified';
    } else if (pendingCount > 0) {
      overallStatus = 'pending';
    } else if (rejectedCount > 0 && verifiedCount === 0) {
      overallStatus = 'rejected';
    } else if (verifiedCount > 0) {
      overallStatus = 'partially_verified';
    }

    res.json({
      success: true,
      status: {
        overall: overallStatus,
        identity: hasVerifiedIdentity,
        address: hasVerifiedAddress,
        property: hasVerifiedProperty,
        counts: {
          total: documents.length,
          pending: pendingCount,
          verified: verifiedCount,
          rejected: rejectedCount
        }
      }
    });
  } catch (error) {
    console.error('Error fetching verification status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch verification status' 
    });
  }
});

// Get a specific document
router.get('/:id', authenticate, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('user', 'name email role')
      .populate('verifiedBy', 'name email');

    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }

    // Check if user owns the document or is admin
    if (document.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    res.json({
      success: true,
      document
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch document' 
    });
  }
});

// Delete a document
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }

    // Check if user owns the document
    if (document.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // Don't allow deletion of verified documents
    if (document.status === 'verified') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete verified documents' 
      });
    }

    // Delete file from disk
    const filePath = path.join(__dirname, '../../', document.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Document.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete document' 
    });
  }
});

// Admin: Get all pending documents
router.get('/admin/pending', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const documents = await Document.find({ 
      status: { $in: ['pending', 'under_review'] } 
    })
      .populate('user', 'name email role')
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Document.countDocuments({ 
      status: { $in: ['pending', 'under_review'] } 
    });

    res.json({
      success: true,
      documents,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching pending documents:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch documents' 
    });
  }
});

// Admin: Get all documents for a user
router.get('/admin/user/:userId', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const documents = await Document.find({ user: req.params.userId })
      .populate('user', 'name email role')
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      documents
    });
  } catch (error) {
    console.error('Error fetching user documents:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch documents' 
    });
  }
});

// Admin: Verify a document
router.patch('/admin/verify/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { status, rejectionReason, notes } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }

    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rejection reason is required' 
      });
    }

    const document = await Document.findByIdAndUpdate(
      req.params.id,
      {
        status,
        verifiedBy: req.user.id,
        verifiedAt: new Date(),
        rejectionReason: status === 'rejected' ? rejectionReason : undefined,
        notes
      },
      { new: true }
    ).populate('user', 'name email role');

    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }

    // TODO: Send notification to user about verification status

    res.json({
      success: true,
      message: `Document ${status}`,
      document
    });
  } catch (error) {
    console.error('Error verifying document:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify document' 
    });
  }
});

// Admin: Mark document as under review
router.patch('/admin/review/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const document = await Document.findByIdAndUpdate(
      req.params.id,
      { status: 'under_review' },
      { new: true }
    );

    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }

    res.json({
      success: true,
      message: 'Document marked as under review',
      document
    });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update document' 
    });
  }
});

module.exports = router;
