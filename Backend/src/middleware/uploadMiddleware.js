const multer = require('multer');
const path = require('path');
const fs = require('fs');

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'staysafe/properties', // default folder, we can override per-upload if needed
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }] // basic optimization
  }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG, PNG, and WebP images are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per file
    files: 6 // Maximum 6 files
  }
});

// Middleware to handle property images upload (3-6 images)
const uploadPropertyImages = upload.array('images', 6);

// Wrapper middleware with custom error handling
const handlePropertyImageUpload = (req, res, next) => {
  uploadPropertyImages(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ message: 'Maximum 6 images allowed' });
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Each image must be less than 5MB' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// Middleware for mess images upload (up to 5 images)
const uploadMessImages = upload.array('images', 5);

const handleMessImageUpload = (req, res, next) => {
  uploadMessImages(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ message: 'Maximum 5 images allowed' });
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Each image must be less than 5MB' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

module.exports = { handlePropertyImageUpload, handleMessImageUpload, upload };
