const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const documentController = require('../controllers/documentController');
const { UPLOADS } = require('../config/constants');
const { validate, adminVerifyDocumentRules } = require('../middleware/validate');

// Configure multer for document uploads (stays here — middleware concern)
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
  if (UPLOADS.ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: UPLOADS.MAX_FILE_SIZE }
});

// ==================== USER ROUTES ====================
router.post('/upload', authenticate, upload.single('document'), documentController.uploadDocument);
router.get('/my-documents', authenticate, documentController.getMyDocuments);
router.get('/verification-status', authenticate, documentController.getVerificationStatus);
router.get('/download/:id', authenticate, documentController.downloadDocument);
router.post('/reverify/:id', authenticate, documentController.requestReverification);
router.delete('/:id', authenticate, documentController.deleteDocument);

// ==================== ADMIN ROUTES ====================
router.get('/admin/pending', authenticate, authorize(['admin']), documentController.getAdminPendingDocuments);
router.get('/admin/user/:userId', authenticate, authorize(['admin']), documentController.getAdminUserDocuments);
router.patch('/admin/verify/:id', authenticate, authorize(['admin']), validate(adminVerifyDocumentRules), documentController.adminVerifyDocument);
router.patch('/admin/review/:id', authenticate, authorize(['admin']), documentController.adminMarkUnderReview);

// ==================== SINGLE DOCUMENT (must be LAST — generic param) ====================
router.get('/:id', authenticate, documentController.getDocumentById);

module.exports = router;
