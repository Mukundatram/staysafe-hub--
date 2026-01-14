import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiShield, 
  FiCheck, 
  FiClock, 
  FiAlertCircle,
  FiUser,
  FiMapPin,
  FiHome,
  FiFileText,
  FiRefreshCw,
  FiUpload,
  FiX,
  FiImage,
  FiTrash2,
  FiEye
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import documentService from '../services/documentService';

const VerificationPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [activeTab, setActiveTab] = useState(user?.role === 'owner' ? 'property' : 'identity');
  const [refreshing, setRefreshing] = useState(false);
  
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [docsResponse, statusResponse] = await Promise.all([
        documentService.getMyDocuments(),
        documentService.getVerificationStatus()
      ]);
      setDocuments(docsResponse.documents || []);
      setVerificationStatus(statusResponse.verificationStatus || null);
    } catch (error) {
      toast.error('Failed to load verification data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getDocumentTypes = () => {
    const types = {
      identity: user?.role === 'owner' 
        ? [
            { value: 'aadhar', label: 'Aadhar Card' },
            { value: 'pan', label: 'PAN Card' },
            { value: 'passport', label: 'Passport' },
            { value: 'driving_license', label: 'Driving License' }
          ]
        : [
            { value: 'student_id', label: '⭐ Student ID Card' },
            { value: 'college_id', label: '⭐ College/University ID' },
            { value: 'aadhar', label: 'Aadhar Card' },
            { value: 'pan', label: 'PAN Card' },
            { value: 'passport', label: 'Passport' }
          ],
      address: [
        { value: 'utility_bill', label: 'Utility Bill' },
        { value: 'bank_statement', label: 'Bank Statement' },
        { value: 'rent_agreement', label: 'Rent Agreement' }
      ],
      property: [
        { value: 'property_deed', label: '⭐ Property Deed' },
        { value: 'property_tax', label: '⭐ Property Tax Receipt' },
        { value: 'ownership_certificate', label: 'Ownership Certificate' },
        { value: 'noc', label: 'NOC Certificate' }
      ]
    };
    return types[activeTab] || [];
  };

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
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024;
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
      const response = await documentService.uploadDocument(formData);
      toast.success('Document uploaded successfully!');
      setFile(null);
      setDocumentType('');
      setDocuments(prev => [response.document, ...prev]);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await documentService.deleteDocument(documentId);
      setDocuments(prev => prev.filter(d => d._id !== documentId));
      toast.success('Document deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete document');
    }
  };

  const handleViewDocument = (document) => {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    window.open(`${baseUrl}${document.filePath}`, '_blank');
  };

  const getDocumentsByCategory = (category) => {
    const categoryMap = {
      identity: ['student_id', 'college_id', 'aadhar', 'pan', 'passport', 'driving_license'],
      address: ['utility_bill', 'bank_statement', 'rent_agreement'],
      property: ['property_deed', 'property_tax', 'ownership_certificate', 'noc']
    };
    return documents.filter(doc => categoryMap[category]?.includes(doc.documentType));
  };

  const getTabs = () => {
    if (user?.role === 'owner') {
      return [
        { id: 'property', label: 'Property Documents', icon: FiHome },
        { id: 'identity', label: 'Identity Proof', icon: FiUser },
        { id: 'address', label: 'Address Proof', icon: FiMapPin }
      ];
    }
    return [
      { id: 'identity', label: 'Student ID', icon: FiUser },
      { id: 'address', label: 'Address Proof', icon: FiMapPin }
    ];
  };

  const tabs = getTabs();
  const categoryDocs = getDocumentsByCategory(activeTab);

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusConfig = (status) => {
    const config = {
      pending: { bg: '#f59e0b', text: 'Pending', icon: FiClock },
      under_review: { bg: '#3b82f6', text: 'Under Review', icon: FiEye },
      verified: { bg: '#10b981', text: 'Verified', icon: FiCheck },
      rejected: { bg: '#ef4444', text: 'Rejected', icon: FiX }
    };
    return config[status] || config.pending;
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-secondary)'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid var(--border-light)',
          borderTopColor: 'var(--accent-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-secondary)',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)'
            }}>
              <FiShield size={28} color="white" />
            </div>
            <div>
              <h1 style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                color: 'var(--text-primary)',
                margin: 0
              }}>
                {user?.role === 'owner' ? 'Property Owner Verification' : 'Student Verification'}
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                {user?.role === 'owner' 
                  ? 'Verify your identity and property ownership'
                  : 'Verify your student status to book accommodations'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <FiRefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {/* Status Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <StatusCard 
            title="Identity Verification"
            verified={verificationStatus?.identity?.verified}
            icon={FiUser}
            total={verificationStatus?.identity?.documents?.total || 0}
            verifiedCount={verificationStatus?.identity?.documents?.verified || 0}
            pending={verificationStatus?.identity?.documents?.pending || 0}
          />
          <StatusCard 
            title="Address Verification"
            verified={verificationStatus?.address?.verified}
            icon={FiMapPin}
            total={verificationStatus?.address?.documents?.total || 0}
            verifiedCount={verificationStatus?.address?.documents?.verified || 0}
            pending={verificationStatus?.address?.documents?.pending || 0}
          />
          {user?.role === 'owner' && (
            <StatusCard 
              title="Property Verification"
              verified={verificationStatus?.property?.verified}
              icon={FiHome}
              total={verificationStatus?.property?.documents?.total || 0}
              verifiedCount={verificationStatus?.property?.documents?.verified || 0}
              pending={verificationStatus?.property?.documents?.pending || 0}
            />
          )}
        </div>

        {/* Status Banner */}
        {verificationStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: '2rem',
              padding: '1.25rem',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              background: verificationStatus.overall ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              border: `1px solid ${verificationStatus.overall ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
            }}
          >
            {verificationStatus.overall ? (
              <FiCheck size={28} color="#10b981" />
            ) : (
              <FiAlertCircle size={28} color="#f59e0b" />
            )}
            <div>
              <p style={{ fontWeight: '600', color: verificationStatus.overall ? '#10b981' : '#f59e0b', margin: 0 }}>
                {verificationStatus.overall ? "You're Fully Verified!" : 'Verification In Progress'}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                {verificationStatus.overall 
                  ? 'All your documents have been verified.'
                  : 'Upload your documents and wait for admin verification.'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Main Card */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '24px',
          border: '1px solid var(--border-light)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)'
        }}>
          {/* Tabs */}
          <div style={{
            padding: '1rem',
            background: 'var(--bg-tertiary)',
            borderBottom: '1px solid var(--border-light)'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      background: isActive ? 'var(--accent-gradient)' : 'transparent',
                      color: isActive ? 'white' : 'var(--text-tertiary)',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--bg-card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={20} />
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
            padding: '1.5rem'
          }}>
            {/* Upload Section */}
            <div style={{
              background: 'var(--bg-tertiary)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FiUpload size={20} color="white" />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                  Upload Document
                </h3>
              </div>

              {/* Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput').click()}
                style={{
                  border: `2px dashed ${dragActive ? 'var(--accent-primary)' : file ? '#10b981' : 'var(--border-medium)'}`,
                  borderRadius: '12px',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragActive ? 'rgba(99, 102, 241, 0.05)' : file ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-card)',
                  marginBottom: '1rem'
                }}
              >
                <input
                  id="fileInput"
                  type="file"
                  style={{ display: 'none' }}
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => e.target.files[0] && validateAndSetFile(e.target.files[0])}
                />
                
                {file ? (
                  <div>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px'
                    }}>
                      {file.type.startsWith('image/') 
                        ? <FiImage size={24} color="white" />
                        : <FiFileText size={24} color="white" />
                      }
                    </div>
                    <p style={{ fontWeight: '500', color: 'var(--text-primary)', margin: 0 }}>{file.name}</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>{formatFileSize(file.size)}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      style={{
                        marginTop: '12px',
                        padding: '6px 12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <FiX size={14} /> Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '12px',
                      background: 'var(--bg-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px'
                    }}>
                      <FiUpload size={24} color="var(--text-tertiary)" />
                    </div>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                      Drag & drop or <span style={{ color: 'var(--accent-primary)', fontWeight: '500' }}>browse</span>
                    </p>
                    <p style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-tertiary)',
                      marginTop: '8px',
                      padding: '4px 12px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '20px',
                      display: 'inline-block'
                    }}>
                      JPEG, PNG, PDF up to 5MB
                    </p>
                  </div>
                )}
              </div>

              {/* Document Type */}
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Document Type <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                  cursor: 'pointer'
                }}
              >
                <option value="">Select document type</option>
                {getDocumentTypes().map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={!file || !documentType || uploading}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: (!file || !documentType || uploading) ? 'var(--bg-tertiary)' : 'var(--accent-gradient)',
                  color: (!file || !documentType || uploading) ? 'var(--text-tertiary)' : 'white',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: (!file || !documentType || uploading) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {uploading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FiUpload size={18} />
                    Upload Document
                  </>
                )}
              </button>
            </div>

            {/* Documents List */}
            <div style={{
              background: 'var(--bg-tertiary)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FiFileText size={20} color="white" />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                  Your Documents
                </h3>
                <span style={{
                  marginLeft: 'auto',
                  padding: '4px 12px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: 'var(--accent-primary)',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  {categoryDocs.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                <AnimatePresence mode="popLayout">
                  {categoryDocs.length > 0 ? (
                    categoryDocs.map((doc, index) => {
                      const status = getStatusConfig(doc.status);
                      const StatusIcon = status.icon;
                      return (
                        <motion.div
                          key={doc._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.05 }}
                          style={{
                            background: 'var(--bg-card)',
                            borderRadius: '12px',
                            padding: '1rem',
                            border: '1px solid var(--border-light)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem'
                          }}
                        >
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: doc.mimeType?.startsWith('image/') 
                              ? 'linear-gradient(135deg, #3b82f6, #6366f1)' 
                              : 'linear-gradient(135deg, #ef4444, #f43f5e)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {doc.mimeType?.startsWith('image/') 
                              ? <FiImage size={20} color="white" />
                              : <FiFileText size={20} color="white" />
                            }
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                                {doc.documentType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                background: status.bg,
                                color: 'white',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <StatusIcon size={12} />
                                {status.text}
                              </span>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>
                              {formatFileSize(doc.fileSize)} • {formatDate(doc.createdAt)}
                            </p>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleViewDocument(doc)}
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                background: 'rgba(59, 130, 246, 0.1)',
                                color: '#3b82f6',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <FiEye size={16} />
                            </button>
                            {doc.status !== 'verified' && (
                              <button
                                onClick={() => handleDeleteDocument(doc._id)}
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '8px',
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  color: '#ef4444',
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <FiTrash2 size={16} />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '3rem',
                      background: 'var(--bg-card)',
                      borderRadius: '12px',
                      border: '2px dashed var(--border-light)'
                    }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '12px',
                        background: 'var(--bg-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem'
                      }}>
                        <FiFileText size={28} color="var(--text-tertiary)" />
                      </div>
                      <p style={{ fontWeight: '500', color: 'var(--text-secondary)', margin: 0 }}>
                        No documents uploaded yet
                      </p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                        Upload your first document to get verified
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Guidelines */}
        <div style={{
          marginTop: '2rem',
          background: 'rgba(99, 102, 241, 0.05)',
          borderRadius: '16px',
          padding: '1.5rem',
          border: '1px solid rgba(99, 102, 241, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiShield size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--accent-primary)', margin: 0 }}>
              {user?.role === 'owner' ? 'Property Owner Guidelines' : 'Student Verification Guidelines'}
            </h3>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '12px',
            marginTop: '1rem'
          }}>
            {(user?.role === 'owner' ? [
              'Upload property deed, tax receipts, or ownership certificate',
              'Government-issued ID (Aadhar, PAN, Passport)',
              'Utility bills or bank statements for address',
              'Verified owners get a trust badge on listings',
              'Verification takes 1-2 business days'
            ] : [
              'Upload your valid college/university ID card',
              'Aadhar card, PAN card, or passport for identity',
              'Any document showing your permanent address',
              'Verified students get priority access',
              'Supported formats: JPEG, PNG, PDF (max 5MB)'
            ]).map((text, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)'
              }}>
                <FiCheck size={16} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// Status Card Component
const StatusCard = ({ title, verified, icon: Icon, total, verifiedCount, pending }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      style={{
        padding: '1.25rem',
        borderRadius: '16px',
        border: `1px solid ${verified ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-light)'}`,
        background: verified ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-card)',
        cursor: 'pointer'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: verified 
            ? 'linear-gradient(135deg, #10b981, #059669)' 
            : 'linear-gradient(135deg, #6b7280, #4b5563)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: verified ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
        }}>
          <Icon size={20} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>{title}</h4>
          <p style={{ fontSize: '0.875rem', color: verified ? '#10b981' : 'var(--text-tertiary)', margin: '2px 0 0' }}>
            {verified ? '✓ Verified' : 'Not Verified'}
          </p>
        </div>
        {verified && (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FiCheck size={16} color="white" />
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
        <span style={{
          padding: '4px 10px',
          borderRadius: '8px',
          fontSize: '0.75rem',
          fontWeight: '500',
          background: 'var(--bg-tertiary)',
          color: 'var(--text-tertiary)'
        }}>
          Total: {total}
        </span>
        <span style={{
          padding: '4px 10px',
          borderRadius: '8px',
          fontSize: '0.75rem',
          fontWeight: '500',
          background: 'rgba(16, 185, 129, 0.1)',
          color: '#10b981'
        }}>
          ✓ {verifiedCount}
        </span>
        <span style={{
          padding: '4px 10px',
          borderRadius: '8px',
          fontSize: '0.75rem',
          fontWeight: '500',
          background: 'rgba(245, 158, 11, 0.1)',
          color: '#f59e0b'
        }}>
          ⏳ {pending}
        </span>
      </div>
    </motion.div>
  );
};

export default VerificationPage;
