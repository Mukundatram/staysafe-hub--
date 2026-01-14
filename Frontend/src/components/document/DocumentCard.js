import React from 'react';
import { motion } from 'framer-motion';
import { 
  FiFileText, 
  FiTrash2, 
  FiClock, 
  FiCheck, 
  FiX, 
  FiEye,
  FiImage
} from 'react-icons/fi';

const statusConfig = {
  pending: {
    color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
    icon: FiClock,
    label: 'Pending'
  },
  under_review: {
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    icon: FiEye,
    label: 'Under Review'
  },
  verified: {
    color: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    icon: FiCheck,
    label: 'Verified'
  },
  rejected: {
    color: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    icon: FiX,
    label: 'Rejected'
  }
};

const documentTypeLabels = {
  student_id: 'Student ID Card',
  college_id: 'College ID Card',
  aadhar: 'Aadhar Card',
  pan: 'PAN Card',
  passport: 'Passport',
  driving_license: 'Driving License',
  utility_bill: 'Utility Bill',
  bank_statement: 'Bank Statement',
  rent_agreement: 'Rent Agreement',
  property_deed: 'Property Deed',
  property_tax: 'Property Tax Receipt',
  other: 'Other Document'
};

const DocumentCard = ({ document, onDelete, onView, showActions = true }) => {
  const status = statusConfig[document.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  const isImage = document.mimeType?.startsWith('image/');

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`p-3 rounded-xl ${isImage ? 'bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/50 dark:to-blue-900/30' : 'bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/50 dark:to-red-900/30'}`}>
          {isImage ? (
            <FiImage className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          ) : (
            <FiFileText className="w-6 h-6 text-red-600 dark:text-red-400" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-gray-900 dark:text-white truncate">
              {documentTypeLabels[document.documentType] || document.documentType}
            </h4>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
            {document.fileName}
          </p>

          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>Size: {formatFileSize(document.fileSize)}</span>
            <span>Uploaded: {formatDate(document.createdAt)}</span>
            {document.expiryDate && (
              <span className={new Date(document.expiryDate) < new Date() ? 'text-red-500' : ''}>
                Expires: {formatDate(document.expiryDate)}
              </span>
            )}
          </div>

          {document.rejectionReason && document.status === 'rejected' && (
            <p className="text-sm text-red-500 mt-2 bg-red-50 dark:bg-red-900/20 p-2 rounded">
              <strong>Reason:</strong> {document.rejectionReason}
            </p>
          )}

          {document.notes && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
              "{document.notes}"
            </p>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2">
            {onView && (
              <button
                onClick={() => onView(document)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                title="View Document"
              >
                <FiEye className="w-5 h-5" />
              </button>
            )}
            {onDelete && document.status !== 'verified' && (
              <button
                onClick={() => onDelete(document._id)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                title="Delete Document"
              >
                <FiTrash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DocumentCard;
