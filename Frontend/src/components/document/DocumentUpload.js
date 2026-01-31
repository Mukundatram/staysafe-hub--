import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUpload, 
  FiX, 
  FiImage,
  FiFileText
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import documentService from '../../services/documentService';

// Student-specific document types
const studentDocumentTypes = [
  { value: 'student_id', label: 'Student ID Card', category: 'identity', priority: true },
  { value: 'college_id', label: 'College/University ID', category: 'identity', priority: true },
  { value: 'pan', label: 'PAN Card', category: 'identity' },
  { value: 'passport', label: 'Passport', category: 'identity' },
  { value: 'driving_license', label: 'Driving License', category: 'identity' },
  { value: 'utility_bill', label: 'Utility Bill', category: 'address' },
  { value: 'bank_statement', label: 'Bank Statement', category: 'address' },
  { value: 'rent_agreement', label: 'Current Rent Agreement', category: 'address' },
  { value: 'other', label: 'Other Document', category: 'other' }
];

// Owner-specific document types
const ownerDocumentTypes = [
  { value: 'property_deed', label: 'Property Deed', category: 'property', priority: true },
  { value: 'property_tax', label: 'Property Tax Receipt', category: 'property', priority: true },
  { value: 'ownership_certificate', label: 'Ownership Certificate', category: 'property' },
  { value: 'noc', label: 'NOC (No Objection Certificate)', category: 'property' },
  { value: 'encumbrance_certificate', label: 'Encumbrance Certificate', category: 'property' },
  { value: 'pan', label: 'PAN Card', category: 'identity' },
  { value: 'passport', label: 'Passport', category: 'identity' },
  { value: 'driving_license', label: 'Driving License', category: 'identity' },
  { value: 'utility_bill', label: 'Utility Bill', category: 'address' },
  { value: 'bank_statement', label: 'Bank Statement', category: 'address' },
  { value: 'other', label: 'Other Document', category: 'other' }
];

const DocumentUpload = ({ onUploadSuccess, category = null, propertyId = null, userRole = 'student' }) => {
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const [notes, setNotes] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Get document types based on user role
  const documentTypes = userRole === 'owner' ? ownerDocumentTypes : studentDocumentTypes;

  const filteredDocTypes = category 
    ? documentTypes.filter(dt => dt.category === category)
    : documentTypes;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Only JPEG, PNG, and PDF files are allowed');
      return;
    }

    if (selectedFile.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !documentType) {
      toast.error('Please select a file and document type');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);
      if (notes) formData.append('notes', notes);
      if (expiryDate) formData.append('expiryDate', expiryDate);
      if (propertyId) formData.append('propertyId', propertyId);

      const response = await documentService.uploadDocument(formData);
      
      toast.success('Document uploaded successfully!');
      setFile(null);
      setDocumentType('');
      setNotes('');
      setExpiryDate('');
      
      if (onUploadSuccess) {
        onUploadSuccess(response.document);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return <FiUpload className="w-12 h-12 text-gray-400" />;
    if (file.type.startsWith('image/')) {
      return <FiImage className="w-12 h-12 text-blue-500" />;
    }
    return <FiFileText className="w-12 h-12 text-red-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
          <FiUpload className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        Upload Document
      </h3>

      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
          dragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]' 
            : file 
              ? 'border-green-400 bg-green-50 dark:bg-green-900/10'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleFileChange}
        />

        <AnimatePresence mode="wait">
          {file ? (
            <motion.div
              key="file"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center"
            >
              {getFileIcon()}
              <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                {file.name}
              </p>
              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="mt-2 text-red-500 hover:text-red-600 text-sm flex items-center gap-1"
              >
                <FiX className="w-4 h-4" /> Remove
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {getFileIcon()}
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                Drag and drop your file here, or <span className="text-blue-600 font-medium hover:underline">browse</span>
              </p>
              <p className="text-xs text-gray-400 mt-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full inline-block">
                Supports JPEG, PNG, PDF up to 5MB
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Form Fields */}
      <div className="mt-5 space-y-4">
        {/* Document Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Document Type <span className="text-red-500">*</span>
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-colors appearance-none cursor-pointer"
          >
            <option value="">Select document type</option>
            {filteredDocTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.priority ? '⭐ ' : ''}{type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Expiry Date (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Expiry Date <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional information..."
          rows={2}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Upload Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleUpload}
        disabled={!file || !documentType || uploading}
        className={`mt-6 w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
          !file || !documentType || uploading
            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {uploading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <FiUpload className="w-5 h-5" />
            Upload Document
          </>
        )}
      </motion.button>
    </div>
  );
};

export default DocumentUpload;
