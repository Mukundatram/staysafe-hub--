import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiOutlineUser,
    HiOutlinePhone,
    HiOutlineDocumentText,
    HiOutlineUpload,
    HiOutlineX,
    HiOutlineCheckCircle,
    HiOutlineExclamationCircle,
    HiChevronDown,
    HiChevronUp
} from 'react-icons/hi';

const AdditionalMemberForm = ({ memberIndex, memberData, onChange }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [errors, setErrors] = useState({});
    const [filePreview, setFilePreview] = useState(null);

    // Validate phone number (exactly 10 digits)
    const validatePhone = (phone) => {
        const phoneRegex = /^\d{10}$/;
        return phoneRegex.test(phone);
    };

    // Validate file (type and size)
    const validateFile = (file) => {
        if (!file) return { valid: true };

        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

        if (!allowedTypes.includes(file.type)) {
            return { valid: false, error: 'Only JPG, PNG, and PDF files are allowed' };
        }

        if (file.size > maxSize) {
            return { valid: false, error: 'File size must be less than 5MB' };
        }

        return { valid: true };
    };

    const handleFieldChange = (field, value) => {
        // Update parent state
        onChange(memberIndex, { ...memberData, [field]: value });

        // Clear error for this field
        setErrors(prev => ({ ...prev, [field]: null }));

        // Validate on change
        if (field === 'phoneNumber' && value) {
            if (!validatePhone(value)) {
                setErrors(prev => ({ ...prev, phoneNumber: 'Phone number must be exactly 10 digits' }));
            }
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validation = validateFile(file);

        if (!validation.valid) {
            setErrors(prev => ({ ...prev, identityProofFile: validation.error }));
            e.target.value = ''; // Reset input
            return;
        }

        // Clear error
        setErrors(prev => ({ ...prev, identityProofFile: null }));

        // Update parent state
        onChange(memberIndex, { ...memberData, identityProofFile: file });

        // Create preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setFilePreview(null);
        }
    };

    const removeFile = () => {
        onChange(memberIndex, { ...memberData, identityProofFile: null });
        setFilePreview(null);
        setErrors(prev => ({ ...prev, identityProofFile: null }));
    };

    const isComplete = memberData.fullName &&
        memberData.phoneNumber &&
        validatePhone(memberData.phoneNumber) &&
        memberData.identityProofFile;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="additional-member-form"
        >
            {/* Accordion Header */}
            <div
                className="member-header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="member-header-left">
                    <HiOutlineUser size={20} />
                    <h4>Member {memberIndex + 2}</h4>
                    {isComplete && (
                        <span className="complete-badge">
                            <HiOutlineCheckCircle size={16} />
                            Complete
                        </span>
                    )}
                </div>
                <button type="button" className="expand-btn">
                    {isExpanded ? <HiChevronUp size={20} /> : <HiChevronDown size={20} />}
                </button>
            </div>

            {/* Accordion Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="member-content"
                    >
                        <div className="form-grid">
                            {/* Full Name */}
                            <div className="form-field">
                                <label>
                                    Full Name <span className="required">*</span>
                                </label>
                                <div className="input-wrapper">
                                    <HiOutlineUser className="input-icon" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Enter full name"
                                        value={memberData.fullName || ''}
                                        onChange={(e) => handleFieldChange('fullName', e.target.value)}
                                        required
                                    />
                                </div>
                                {errors.fullName && (
                                    <span className="error-text">
                                        <HiOutlineExclamationCircle size={14} />
                                        {errors.fullName}
                                    </span>
                                )}
                            </div>

                            {/* Phone Number */}
                            <div className="form-field">
                                <label>
                                    Phone Number <span className="required">*</span>
                                </label>
                                <div className="input-wrapper">
                                    <HiOutlinePhone className="input-icon" size={18} />
                                    <input
                                        type="tel"
                                        placeholder="10-digit mobile number"
                                        value={memberData.phoneNumber || ''}
                                        onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                                        maxLength={10}
                                        required
                                    />
                                </div>
                                {errors.phoneNumber && (
                                    <span className="error-text">
                                        <HiOutlineExclamationCircle size={14} />
                                        {errors.phoneNumber}
                                    </span>
                                )}
                            </div>

                            {/* Identity Proof Type */}
                            <div className="form-field">
                                <label>
                                    Identity Proof Type <span className="required">*</span>
                                </label>
                                <div className="input-wrapper">
                                    <HiOutlineDocumentText className="input-icon" size={18} />
                                    <select
                                        value={memberData.identityProofType || 'Aadhar Card'}
                                        onChange={(e) => handleFieldChange('identityProofType', e.target.value)}
                                        required
                                    >
                                        <option value="Aadhar Card">Aadhar Card</option>
                                        <option value="Student ID">Student ID</option>
                                        <option value="PAN Card">PAN Card</option>
                                    </select>
                                </div>
                            </div>

                            {/* File Upload */}
                            <div className="form-field full-width">
                                <label>
                                    Upload ID Proof <span className="required">*</span>
                                </label>
                                <div className="file-upload-section">
                                    {!memberData.identityProofFile ? (
                                        <label className="file-upload-label">
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png,application/pdf"
                                                onChange={handleFileChange}
                                                className="file-input"
                                            />
                                            <div className="upload-placeholder">
                                                <HiOutlineUpload size={32} />
                                                <span>Click to upload or drag and drop</span>
                                                <small>JPG, PNG or PDF (max 5MB)</small>
                                            </div>
                                        </label>
                                    ) : (
                                        <div className="file-preview">
                                            {filePreview ? (
                                                <img src={filePreview} alt="ID Preview" className="preview-image" />
                                            ) : (
                                                <div className="pdf-preview">
                                                    <HiOutlineDocumentText size={48} />
                                                    <span>{memberData.identityProofFile.name}</span>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={removeFile}
                                                className="remove-file-btn"
                                            >
                                                <HiOutlineX size={18} />
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {errors.identityProofFile && (
                                    <span className="error-text">
                                        <HiOutlineExclamationCircle size={14} />
                                        {errors.identityProofFile}
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
        .additional-member-form {
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .member-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          cursor: pointer;
          transition: background var(--transition-fast);
        }

        .member-header:hover {
          background: var(--bg-tertiary);
        }

        .member-header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .member-header-left h4 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .complete-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          background: var(--success-alpha);
          color: var(--success);
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .expand-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          transition: color var(--transition-fast);
        }

        .expand-btn:hover {
          color: var(--text-primary);
        }

        .member-content {
          padding: 0 1.25rem 1.25rem;
          overflow: hidden;
        }

        .form-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: 1fr;
        }

        @media (min-width: 640px) {
          .form-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-field.full-width {
          grid-column: 1 / -1;
        }

        .form-field label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .required {
          color: var(--error);
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 0.75rem;
          color: var(--text-tertiary);
          pointer-events: none;
        }

        .input-wrapper input,
        .input-wrapper select {
          width: 100%;
          padding: 0.625rem 0.75rem 0.625rem 2.5rem;
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 0.875rem;
          transition: all var(--transition-fast);
        }

        .input-wrapper input:focus,
        .input-wrapper select:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px var(--accent-primary-alpha);
        }

        .error-text {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: var(--error);
        }

        .file-upload-section {
          width: 100%;
        }

        .file-upload-label {
          display: block;
          cursor: pointer;
        }

        .file-input {
          display: none;
        }

        .upload-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: var(--bg-card);
          border: 2px dashed var(--border-light);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
          color: var(--text-secondary);
          text-align: center;
        }

        .upload-placeholder:hover {
          border-color: var(--accent-primary);
          background: var(--accent-primary-alpha);
        }

        .upload-placeholder span {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .upload-placeholder small {
          margin-top: 0.25rem;
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }

        .file-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
        }

        .preview-image {
          max-width: 100%;
          max-height: 200px;
          border-radius: var(--radius-md);
          object-fit: contain;
        }

        .pdf-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
        }

        .pdf-preview span {
          font-size: 0.875rem;
          text-align: center;
          word-break: break-word;
        }

        .remove-file-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--error-alpha);
          color: var(--error);
          border: none;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .remove-file-btn:hover {
          background: var(--error);
          color: white;
        }
      `}</style>
        </motion.div>
    );
};

export default AdditionalMemberForm;
