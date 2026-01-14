import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { bookingService } from '../../services/propertyService';
import documentService from '../../services/documentService';
import analyticsService from '../../services/analyticsService';
import { useAuth } from '../../context/AuthContext';
import Loading from '../../components/ui/Loading';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  HiOutlineClipboardList,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineHome,
  HiOutlineCalendar,
  HiOutlineRefresh,
  HiOutlineUser,
  HiOutlineEye,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineCurrencyRupee,
  HiOutlineClock,
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
  HiOutlineExclamation,
  HiOutlineIdentification,
  HiOutlineDownload,
  HiOutlineChartBar,
  HiOutlineTrendingUp,
  HiOutlineUsers,
  HiOutlineStar
} from 'react-icons/hi';

const AdminDashboard = () => {
  useAuth(); // Ensure user is authenticated
  
  // Main section toggle
  const [activeSection, setActiveSection] = useState('bookings');
  
  // Booking states
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Document verification states
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentTab, setDocumentTab] = useState('pending');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [documentActionLoading, setDocumentActionLoading] = useState(null);
  
  // Analytics states
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      const response = await analyticsService.getAdminStats();
      setAnalytics(response.stats);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    fetchDocuments();
    fetchAnalytics();
  }, [fetchAnalytics]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getAll();
      setBookings(data);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    toast.promise(fetchBookings(), {
      loading: 'Refreshing bookings...',
      success: 'Bookings refreshed!',
      error: 'Failed to refresh'
    });
  };

  // Document functions
  const fetchDocuments = async () => {
    try {
      setDocumentsLoading(true);
      const response = await documentService.getPendingDocuments(1, 50);
      setDocuments(response.documents || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      toast.error('Failed to load documents');
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleRefreshDocuments = async () => {
    toast.promise(fetchDocuments(), {
      loading: 'Refreshing documents...',
      success: 'Documents refreshed!',
      error: 'Failed to refresh'
    });
  };

  const handleDocumentAction = async (documentId, action) => {
    try {
      setDocumentActionLoading(documentId);
      
      if (action === 'review') {
        await documentService.markUnderReview(documentId);
        toast.success('Document marked as under review');
      } else {
        await documentService.verifyDocument(documentId, action, action === 'rejected' ? rejectionReason : '');
        toast.success(`Document ${action} successfully!`);
      }
      
      fetchDocuments();
      setShowDocumentModal(false);
      setRejectionReason('');
    } catch (err) {
      console.error('Failed to update document:', err);
      toast.error('Failed to update document');
    } finally {
      setDocumentActionLoading(null);
    }
  };

  const openDocumentModal = (doc) => {
    setSelectedDocument(doc);
    setShowDocumentModal(true);
    setRejectionReason('');
  };

  const getDocumentTypeIcon = (type) => {
    switch (type) {
      case 'student_id': return <HiOutlineIdentification size={18} />;
      case 'address_proof': return <HiOutlineHome size={18} />;
      case 'property_ownership': return <HiOutlineDocumentText size={18} />;
      default: return <HiOutlineDocumentText size={18} />;
    }
  };

  const getDocumentTypeName = (type) => {
    switch (type) {
      case 'student_id': return 'Student ID';
      case 'address_proof': return 'Address Proof';
      case 'property_ownership': return 'Property Ownership';
      default: return type;
    }
  };

  const getDocStatusVariant = (status) => {
    switch (status) {
      case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'under_review': return 'info';
      case 'rejected': return 'error';
      default: return 'info';
    }
  };

  const handleStatusUpdate = async (bookingId, status) => {
    try {
      setActionLoading(bookingId);
      await bookingService.updateStatus(bookingId, status);
      toast.success(`Booking ${status.toLowerCase()} successfully!`);
      fetchBookings();
      setShowDetailModal(false);
    } catch (err) {
      console.error('Failed to update booking:', err);
      toast.error('Failed to update booking');
    } finally {
      setActionLoading(null);
    }
  };

  const openDetailModal = (booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Confirmed': return 'success';
      case 'Pending': return 'warning';
      case 'Rejected': return 'error';
      default: return 'info';
    }
  };

  const stats = {
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === 'Pending').length,
    confirmedBookings: bookings.filter(b => b.status === 'Confirmed').length,
    rejectedBookings: bookings.filter(b => b.status === 'Rejected').length,
  };

  const documentStats = {
    total: documents.length,
    pending: documents.filter(d => d.status === 'pending').length,
    underReview: documents.filter(d => d.status === 'under_review').length,
  };

  const filteredDocuments = documents.filter(doc => {
    if (documentTab === 'all') return true;
    if (documentTab === 'pending') return doc.status === 'pending';
    if (documentTab === 'under_review') return doc.status === 'under_review';
    return true;
  });

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return booking.status === 'Pending';
    if (activeTab === 'confirmed') return booking.status === 'Confirmed';
    if (activeTab === 'rejected') return booking.status === 'Rejected';
    return true;
  });

  if (loading && documentsLoading) {
    return (
      <div className="dashboard-page">
        <div className="container">
          <Loading size="lg" text="Loading admin dashboard..." />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-header"
        >
          <div className="header-content">
            <h1>Admin Dashboard</h1>
            <p>Manage bookings, verify documents, and oversee platform operations.</p>
          </div>
          <div className="header-actions">
            <button 
              className="refresh-btn" 
              onClick={activeSection === 'bookings' ? handleRefresh : handleRefreshDocuments} 
              title={`Refresh ${activeSection}`}
            >
              <HiOutlineRefresh size={20} />
            </button>
          </div>
        </motion.div>

        {/* Main Section Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="main-section-nav"
        >
          <button
            className={`section-tab ${activeSection === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveSection('bookings')}
          >
            <HiOutlineClipboardList size={20} />
            <span>Bookings</span>
            {stats.pendingBookings > 0 && (
              <span className="badge-count">{stats.pendingBookings}</span>
            )}
          </button>
          <button
            className={`section-tab ${activeSection === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveSection('documents')}
          >
            <HiOutlineShieldCheck size={20} />
            <span>Document Verification</span>
            {documentStats.pending > 0 && (
              <span className="badge-count">{documentStats.pending}</span>
            )}
          </button>
          <button
            className={`section-tab ${activeSection === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveSection('analytics')}
          >
            <HiOutlineChartBar size={20} />
            <span>Analytics</span>
          </button>
        </motion.div>

        {/* BOOKINGS SECTION */}
        {activeSection === 'bookings' && (
          <>
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="stats-grid"
            >
              <Card padding="md" className="stat-card">
                <div className="stat-icon">
                  <HiOutlineClipboardList size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{stats.totalBookings}</span>
                  <span className="stat-label">Total Bookings</span>
                </div>
              </Card>

              <Card padding="md" className="stat-card">
                <div className="stat-icon pending">
                  <HiOutlineCalendar size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{stats.pendingBookings}</span>
                  <span className="stat-label">Pending</span>
                </div>
              </Card>

              <Card padding="md" className="stat-card">
                <div className="stat-icon success">
                  <HiOutlineCheck size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{stats.confirmedBookings}</span>
                  <span className="stat-label">Confirmed</span>
                </div>
              </Card>

              <Card padding="md" className="stat-card">
                <div className="stat-icon error">
                  <HiOutlineX size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{stats.rejectedBookings}</span>
                  <span className="stat-label">Rejected</span>
                </div>
              </Card>
            </motion.div>

            {/* Bookings Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card padding="lg">
                <div className="card-header">
                  <h2>
                    <HiOutlineClipboardList size={24} />
                    All Bookings
                  </h2>
                </div>

                {/* Tabs */}
                <div className="tabs-container">
                  <button
                    className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                  >
                    All ({bookings.length})
                  </button>
                  <button
                    className={`tab pending ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                  >
                    Pending ({stats.pendingBookings})
                  </button>
                  <button
                    className={`tab confirmed ${activeTab === 'confirmed' ? 'active' : ''}`}
                    onClick={() => setActiveTab('confirmed')}
                  >
                    Confirmed ({stats.confirmedBookings})
                  </button>
                  <button
                    className={`tab rejected ${activeTab === 'rejected' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rejected')}
                  >
                    Rejected ({stats.rejectedBookings})
                  </button>
                </div>

            {filteredBookings.length === 0 ? (
              <EmptyState
                icon={HiOutlineClipboardList}
                title={activeTab === 'all' ? 'No bookings yet' : `No ${activeTab} bookings`}
                description={activeTab === 'all' 
                  ? 'Bookings will appear here once students start booking properties.'
                  : `There are no ${activeTab} bookings at the moment.`
                }
              />
            ) : (
              <div className="bookings-grid">
                {filteredBookings.map((booking) => (
                  <motion.div
                    key={booking._id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="booking-card"
                  >
                    <div className="booking-header">
                      <Badge variant={getStatusVariant(booking.status)}>
                        {booking.status}
                      </Badge>
                      <span className="booking-id">#{booking._id?.slice(-6)}</span>
                    </div>

                    <div className="booking-student">
                      <div className="user-avatar">
                        {booking.student?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="user-info">
                        <span className="user-name">{booking.student?.name || 'Unknown'}</span>
                        <span className="user-email">{booking.student?.email || 'No email'}</span>
                      </div>
                    </div>

                    <div className="booking-property">
                      <HiOutlineHome size={18} />
                      <span>{booking.property?.title || 'Property'}</span>
                    </div>

                    <div className="booking-dates">
                      <HiOutlineCalendar size={16} />
                      <span>
                        {format(new Date(booking.startDate), 'MMM d')} - {format(new Date(booking.endDate), 'MMM d, yyyy')}
                      </span>
                    </div>

                    <div className="booking-actions">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openDetailModal(booking)}
                        leftIcon={<HiOutlineEye size={16} />}
                      >
                        View
                      </Button>
                      {booking.status === 'Pending' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStatusUpdate(booking._id, 'Confirmed')}
                            isLoading={actionLoading === booking._id}
                            leftIcon={<HiOutlineCheck size={16} />}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleStatusUpdate(booking._id, 'Rejected')}
                            isLoading={actionLoading === booking._id}
                            leftIcon={<HiOutlineX size={16} />}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Booking Detail Modal */}
        <AnimatePresence>
          {showDetailModal && selectedBooking && (
            <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h2>Booking Details</h2>
                  <button className="close-btn" onClick={() => setShowDetailModal(false)}>
                    <HiOutlineX size={24} />
                  </button>
                </div>

                <div className="modal-body">
                  <div className="detail-section">
                    <h3>Booking Status</h3>
                    <Badge variant={getStatusVariant(selectedBooking.status)} size="lg">
                      {selectedBooking.status}
                    </Badge>
                    <p className="booking-id-full">
                      Booking ID: {selectedBooking._id}
                    </p>
                  </div>

                  <div className="detail-section">
                    <h3><HiOutlineUser size={18} /> Student Information</h3>
                    <div className="detail-row">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">{selectedBooking.student?.name || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label"><HiOutlineMail size={14} /> Email:</span>
                      <span className="detail-value">{selectedBooking.student?.email || 'N/A'}</span>
                    </div>
                    {selectedBooking.student?.phone && (
                      <div className="detail-row">
                        <span className="detail-label"><HiOutlinePhone size={14} /> Phone:</span>
                        <span className="detail-value">{selectedBooking.student.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="detail-section">
                    <h3><HiOutlineHome size={18} /> Property Information</h3>
                    <div className="detail-row">
                      <span className="detail-label">Title:</span>
                      <span className="detail-value">{selectedBooking.property?.title || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label"><HiOutlineLocationMarker size={14} /> Location:</span>
                      <span className="detail-value">{selectedBooking.property?.location || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label"><HiOutlineCurrencyRupee size={14} /> Rent:</span>
                      <span className="detail-value rent">₹{selectedBooking.property?.rent?.toLocaleString() || 'N/A'}/month</span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3><HiOutlineClock size={18} /> Booking Duration</h3>
                    <div className="detail-row">
                      <span className="detail-label">Start Date:</span>
                      <span className="detail-value">{format(new Date(selectedBooking.startDate), 'MMMM d, yyyy')}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">End Date:</span>
                      <span className="detail-value">{format(new Date(selectedBooking.endDate), 'MMMM d, yyyy')}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Booked On:</span>
                      <span className="detail-value">{format(new Date(selectedBooking.createdAt || Date.now()), 'MMMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>

                {selectedBooking.status === 'Pending' && (
                  <div className="modal-actions">
                    <Button
                      variant="danger"
                      onClick={() => handleStatusUpdate(selectedBooking._id, 'Rejected')}
                      isLoading={actionLoading === selectedBooking._id}
                      leftIcon={<HiOutlineX size={16} />}
                    >
                      Reject Booking
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => handleStatusUpdate(selectedBooking._id, 'Confirmed')}
                      isLoading={actionLoading === selectedBooking._id}
                      leftIcon={<HiOutlineCheck size={16} />}
                    >
                      Approve Booking
                    </Button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
          </>
        )}

        {/* DOCUMENTS SECTION */}
        {activeSection === 'documents' && (
          <>
            {/* Document Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="stats-grid"
            >
              <Card padding="md" className="stat-card">
                <div className="stat-icon">
                  <HiOutlineDocumentText size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{documentStats.total}</span>
                  <span className="stat-label">Total Documents</span>
                </div>
              </Card>

              <Card padding="md" className="stat-card">
                <div className="stat-icon pending">
                  <HiOutlineExclamation size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{documentStats.pending}</span>
                  <span className="stat-label">Pending Review</span>
                </div>
              </Card>

              <Card padding="md" className="stat-card">
                <div className="stat-icon info">
                  <HiOutlineEye size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{documentStats.underReview}</span>
                  <span className="stat-label">Under Review</span>
                </div>
              </Card>
            </motion.div>

            {/* Documents List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card padding="lg">
                <div className="card-header">
                  <h2>
                    <HiOutlineShieldCheck size={24} />
                    Document Verification
                  </h2>
                </div>

                {/* Document Tabs */}
                <div className="tabs-container">
                  <button
                    className={`tab ${documentTab === 'all' ? 'active' : ''}`}
                    onClick={() => setDocumentTab('all')}
                  >
                    All ({documentStats.total})
                  </button>
                  <button
                    className={`tab pending ${documentTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setDocumentTab('pending')}
                  >
                    Pending ({documentStats.pending})
                  </button>
                  <button
                    className={`tab ${documentTab === 'under_review' ? 'active' : ''}`}
                    onClick={() => setDocumentTab('under_review')}
                  >
                    Under Review ({documentStats.underReview})
                  </button>
                </div>

                {documentsLoading ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <Loading size="md" text="Loading documents..." />
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <EmptyState
                    icon={HiOutlineShieldCheck}
                    title={documentTab === 'all' ? 'No documents to verify' : `No ${documentTab.replace('_', ' ')} documents`}
                    description={documentTab === 'all' 
                      ? 'Documents submitted by users will appear here for verification.'
                      : `There are no documents with ${documentTab.replace('_', ' ')} status.`
                    }
                  />
                ) : (
                  <div className="documents-grid">
                    {filteredDocuments.map((doc) => (
                      <motion.div
                        key={doc._id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="document-card"
                      >
                        <div className="document-header">
                          <Badge variant={getDocStatusVariant(doc.status)}>
                            {doc.status.replace('_', ' ')}
                          </Badge>
                          <span className="document-id">#{doc._id?.slice(-6)}</span>
                        </div>

                        <div className="document-type">
                          {getDocumentTypeIcon(doc.documentType)}
                          <span>{getDocumentTypeName(doc.documentType)}</span>
                        </div>

                        <div className="document-user">
                          <div className="user-avatar">
                            {doc.user?.name?.charAt(0) || 'U'}
                          </div>
                          <div className="user-info">
                            <span className="user-name">{doc.user?.name || 'Unknown'}</span>
                            <span className="user-email">{doc.user?.email || 'No email'}</span>
                          </div>
                        </div>

                        <div className="document-meta">
                          <HiOutlineClock size={16} />
                          <span>Submitted: {format(new Date(doc.createdAt), 'MMM d, yyyy')}</span>
                        </div>

                        <div className="document-actions">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openDocumentModal(doc)}
                            leftIcon={<HiOutlineEye size={16} />}
                          >
                            Review
                          </Button>
                          {doc.status === 'pending' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleDocumentAction(doc._id, 'review')}
                              isLoading={documentActionLoading === doc._id}
                              leftIcon={<HiOutlineEye size={16} />}
                            >
                              Start Review
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Document Detail Modal */}
            <AnimatePresence>
              {showDocumentModal && selectedDocument && (
                <div className="modal-overlay" onClick={() => setShowDocumentModal(false)}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="modal document-modal"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="modal-header">
                      <h2>Document Review</h2>
                      <button className="close-btn" onClick={() => setShowDocumentModal(false)}>
                        <HiOutlineX size={24} />
                      </button>
                    </div>

                    <div className="modal-body">
                      <div className="detail-section">
                        <h3>Document Status</h3>
                        <Badge variant={getDocStatusVariant(selectedDocument.status)} size="lg">
                          {selectedDocument.status.replace('_', ' ')}
                        </Badge>
                        <p className="document-id-full">
                          Document ID: {selectedDocument._id}
                        </p>
                      </div>

                      <div className="detail-section">
                        <h3>Document Type</h3>
                        <div className="document-type-display">
                          {getDocumentTypeIcon(selectedDocument.documentType)}
                          <span>{getDocumentTypeName(selectedDocument.documentType)}</span>
                        </div>
                      </div>

                      <div className="detail-section">
                        <h3><HiOutlineUser size={18} /> User Information</h3>
                        <div className="detail-row">
                          <span className="detail-label">Name:</span>
                          <span className="detail-value">{selectedDocument.user?.name || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label"><HiOutlineMail size={14} /> Email:</span>
                          <span className="detail-value">{selectedDocument.user?.email || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Role:</span>
                          <span className="detail-value" style={{ textTransform: 'capitalize' }}>{selectedDocument.user?.role || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="detail-section">
                        <h3><HiOutlineDocumentText size={18} /> Document Preview</h3>
                        <div className="document-preview">
                          {selectedDocument.filePath?.toLowerCase().endsWith('.pdf') ? (
                            <div className="pdf-preview">
                              <HiOutlineDocumentText size={48} />
                              <p>PDF Document</p>
                              <a 
                                href={`http://localhost:4000${selectedDocument.filePath}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="download-link"
                              >
                                <HiOutlineDownload size={16} />
                                View PDF
                              </a>
                            </div>
                          ) : (
                            <img 
                              src={`http://localhost:4000${selectedDocument.filePath}`}
                              alt="Document"
                              className="document-image"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentNode.innerHTML = '<p style="color: var(--text-tertiary);">Unable to load image</p>';
                              }}
                            />
                          )}
                        </div>
                      </div>

                      {(selectedDocument.status === 'pending' || selectedDocument.status === 'under_review') && (
                        <div className="detail-section">
                          <h3><HiOutlineExclamation size={18} /> Rejection Reason (if rejecting)</h3>
                          <textarea
                            className="rejection-input"
                            placeholder="Enter reason for rejection (required if rejecting)"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={3}
                          />
                        </div>
                      )}
                    </div>

                    {(selectedDocument.status === 'pending' || selectedDocument.status === 'under_review') && (
                      <div className="modal-actions">
                        <Button
                          variant="danger"
                          onClick={() => {
                            if (!rejectionReason.trim()) {
                              toast.error('Please provide a reason for rejection');
                              return;
                            }
                            handleDocumentAction(selectedDocument._id, 'rejected');
                          }}
                          isLoading={documentActionLoading === selectedDocument._id}
                          leftIcon={<HiOutlineX size={16} />}
                        >
                          Reject Document
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => handleDocumentAction(selectedDocument._id, 'verified')}
                          isLoading={documentActionLoading === selectedDocument._id}
                          leftIcon={<HiOutlineCheck size={16} />}
                        >
                          Approve Document
                        </Button>
                      </div>
                    )}
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* ANALYTICS SECTION */}
        {activeSection === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {analyticsLoading ? (
              <Card padding="xl">
                <Loading size="lg" text="Loading analytics..." />
              </Card>
            ) : analytics ? (
              <div className="analytics-section">
                {/* User Statistics */}
                <div className="analytics-grid">
                  <Card padding="md" className="analytics-card">
                    <div className="analytics-card-header">
                      <div className="analytics-icon users">
                        <HiOutlineUsers size={24} />
                      </div>
                      <span className="analytics-label">Total Users</span>
                    </div>
                    <div className="analytics-value-large">{analytics.users?.total || 0}</div>
                    <div className="analytics-breakdown">
                      <span className="breakdown-item">👨‍🎓 {analytics.users?.students || 0} Students</span>
                      <span className="breakdown-item">🏠 {analytics.users?.owners || 0} Owners</span>
                    </div>
                  </Card>

                  <Card padding="md" className="analytics-card">
                    <div className="analytics-card-header">
                      <div className="analytics-icon properties">
                        <HiOutlineHome size={24} />
                      </div>
                      <span className="analytics-label">Properties</span>
                    </div>
                    <div className="analytics-value-large">{analytics.properties?.total || 0}</div>
                    <div className="analytics-detail">
                      {analytics.properties?.available || 0} available • Avg rent ₹{Math.round(analytics.properties?.averageRent || 0).toLocaleString()}
                    </div>
                  </Card>

                  <Card padding="md" className="analytics-card">
                    <div className="analytics-card-header">
                      <div className="analytics-icon bookings">
                        <HiOutlineClipboardList size={24} />
                      </div>
                      <span className="analytics-label">Total Bookings</span>
                    </div>
                    <div className="analytics-value-large">{analytics.bookings?.total || 0}</div>
                    <div className="analytics-breakdown">
                      <span className="breakdown-item confirmed">✓ {analytics.bookings?.confirmed || 0} Confirmed</span>
                      <span className="breakdown-item pending">⏳ {analytics.bookings?.pending || 0} Pending</span>
                    </div>
                  </Card>

                  <Card padding="md" className="analytics-card">
                    <div className="analytics-card-header">
                      <div className="analytics-icon revenue">
                        <HiOutlineCurrencyRupee size={24} />
                      </div>
                      <span className="analytics-label">Platform Revenue</span>
                    </div>
                    <div className="analytics-value-large">₹{(analytics.revenue?.total || 0).toLocaleString()}</div>
                    <div className="analytics-detail">
                      Total booking value on platform
                    </div>
                  </Card>
                </div>

                {/* User Growth Chart */}
                <Card padding="lg" className="chart-card">
                  <div className="card-header">
                    <h2>
                      <HiOutlineTrendingUp size={24} />
                      User Growth (Last 6 Months)
                    </h2>
                  </div>
                  <div className="chart-container">
                    <div className="bar-chart">
                      {analytics.users?.growth?.map((month, index) => {
                        const maxUsers = Math.max(...analytics.users.growth.map(m => m.total), 1);
                        const height = (month.total / maxUsers) * 100;
                        return (
                          <div key={index} className="bar-item">
                            <div className="bar-wrapper">
                              <div 
                                className="bar" 
                                style={{ height: `${height}%` }}
                                title={`${month.total} new users`}
                              >
                                <span className="bar-value">{month.total}</span>
                              </div>
                            </div>
                            <span className="bar-label">{month.month}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>

                {/* Booking Trends & Revenue */}
                <div className="charts-row">
                  <Card padding="lg" className="chart-card">
                    <div className="card-header">
                      <h2>
                        <HiOutlineCalendar size={24} />
                        Booking Trends
                      </h2>
                    </div>
                    <div className="chart-container">
                      <div className="bar-chart">
                        {analytics.bookings?.trends?.map((month, index) => {
                          const maxBookings = Math.max(...analytics.bookings.trends.map(m => m.total), 1);
                          const height = (month.total / maxBookings) * 100;
                          return (
                            <div key={index} className="bar-item">
                              <div className="bar-wrapper">
                                <div 
                                  className="bar bar-gradient-green" 
                                  style={{ height: `${height}%` }}
                                  title={`${month.total} bookings`}
                                >
                                  <span className="bar-value">{month.total}</span>
                                </div>
                              </div>
                              <span className="bar-label">{month.month}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Card>

                  <Card padding="lg" className="chart-card">
                    <div className="card-header">
                      <h2>
                        <HiOutlineCurrencyRupee size={24} />
                        Monthly Revenue
                      </h2>
                    </div>
                    <div className="chart-container">
                      <div className="bar-chart">
                        {analytics.revenue?.monthly?.map((month, index) => {
                          const maxRevenue = Math.max(...analytics.revenue.monthly.map(m => m.revenue), 1);
                          const height = (month.revenue / maxRevenue) * 100;
                          return (
                            <div key={index} className="bar-item">
                              <div className="bar-wrapper">
                                <div 
                                  className="bar bar-gradient-gold" 
                                  style={{ height: `${height}%` }}
                                  title={`₹${month.revenue.toLocaleString()}`}
                                >
                                  <span className="bar-value">₹{month.revenue >= 1000 ? `${(month.revenue/1000).toFixed(0)}k` : month.revenue}</span>
                                </div>
                              </div>
                              <span className="bar-label">{month.month}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Top Properties */}
                <Card padding="lg" className="top-properties-card">
                  <div className="card-header">
                    <h2>
                      <HiOutlineStar size={24} />
                      Top Properties by Bookings
                    </h2>
                  </div>
                  {analytics.topProperties?.length > 0 ? (
                    <div className="top-properties-list">
                      {analytics.topProperties.map((property, index) => (
                        <div key={property._id} className="top-property-item">
                          <div className="rank">#{index + 1}</div>
                          <div className="property-info">
                            <span className="property-title">{property.title}</span>
                            <span className="property-meta">₹{property.rent?.toLocaleString()}/month</span>
                          </div>
                          <div className="booking-count">
                            <span className="count">{property.bookingCount}</span>
                            <span className="label">bookings</span>
                          </div>
                          <div className="property-rating">
                            <HiOutlineStar size={16} />
                            <span>{property.rating?.toFixed(1) || '0.0'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={HiOutlineHome}
                      title="No booking data yet"
                      description="Top properties will appear here once bookings are made."
                    />
                  )}
                </Card>

                {/* Recent Activity */}
                <div className="activity-row">
                  <Card padding="lg" className="activity-card">
                    <div className="card-header">
                      <h2>
                        <HiOutlineClipboardList size={24} />
                        Recent Bookings
                      </h2>
                    </div>
                    {analytics.recentActivity?.bookings?.length > 0 ? (
                      <div className="activity-list">
                        {analytics.recentActivity.bookings.map((booking) => (
                          <div key={booking._id} className="activity-item">
                            <div className="activity-avatar">
                              {booking.student?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="activity-info">
                              <span className="activity-title">{booking.student?.name || 'Unknown'}</span>
                              <span className="activity-meta">booked {booking.property?.title || 'Property'}</span>
                            </div>
                            <Badge variant={booking.status === 'Confirmed' ? 'success' : booking.status === 'Pending' ? 'warning' : 'info'}>
                              {booking.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-activity">No recent bookings</p>
                    )}
                  </Card>

                  <Card padding="lg" className="activity-card">
                    <div className="card-header">
                      <h2>
                        <HiOutlineUser size={24} />
                        New Users
                      </h2>
                    </div>
                    {analytics.recentActivity?.users?.length > 0 ? (
                      <div className="activity-list">
                        {analytics.recentActivity.users.map((user) => (
                          <div key={user._id} className="activity-item">
                            <div className="activity-avatar">
                              {user.name?.charAt(0) || 'U'}
                            </div>
                            <div className="activity-info">
                              <span className="activity-title">{user.name}</span>
                              <span className="activity-meta">{user.email}</span>
                            </div>
                            <Badge variant={user.role === 'student' ? 'info' : user.role === 'owner' ? 'success' : 'primary'}>
                              {user.role}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-activity">No new users</p>
                    )}
                  </Card>
                </div>
              </div>
            ) : (
              <Card padding="xl">
                <EmptyState
                  icon={HiOutlineChartBar}
                  title="No analytics available"
                  description="Platform analytics will appear here once there is data."
                />
              </Card>
            )}
          </motion.div>
        )}
      </div>

      <style>{`
        .dashboard-page {
          min-height: calc(100vh - 80px);
          padding: 2rem 0 4rem;
          background: var(--bg-secondary);
        }

        .dashboard-header {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .header-content h1 {
          font-size: 1.75rem;
          margin-bottom: 0.25rem;
        }

        .header-content p {
          color: var(--text-secondary);
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .refresh-btn {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }

        .refresh-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          border-radius: var(--radius-lg);
          color: var(--text-secondary);
        }

        .stat-icon.pending {
          background: var(--warning-bg);
          color: var(--warning);
        }

        .stat-icon.success {
          background: var(--success-bg);
          color: var(--success);
        }

        .stat-icon.error {
          background: var(--error-bg);
          color: var(--error);
        }

        .stat-info {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--text-tertiary);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .card-header h2 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.25rem;
        }

        /* Tabs */
        .tabs-container {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 1rem;
          overflow-x: auto;
        }

        .tab {
          padding: 0.625rem 1.25rem;
          border-radius: var(--radius-lg);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }

        .tab:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .tab.active {
          background: var(--accent-primary);
          color: white;
        }

        .tab.pending.active {
          background: var(--warning);
        }

        .tab.confirmed.active {
          background: var(--success);
        }

        .tab.rejected.active {
          background: var(--error);
        }

        /* Bookings Grid */
        .bookings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1rem;
        }

        .booking-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-xl);
          padding: 1.25rem;
          transition: all var(--transition-normal);
        }

        .booking-card:hover {
          border-color: var(--accent-primary);
          box-shadow: var(--shadow-md);
        }

        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .booking-id {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          font-family: monospace;
        }

        .booking-student {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-light);
        }

        .user-avatar {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-gradient);
          border-radius: var(--radius-full);
          color: white;
          font-weight: 600;
          font-size: 1.125rem;
        }

        .user-info {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .user-email {
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }

        .booking-property {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .booking-property svg {
          color: var(--accent-primary);
        }

        .booking-dates {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }

        .booking-actions {
          display: flex;
          gap: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-light);
        }

        .booking-actions button {
          flex: 1;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal {
          width: 100%;
          max-width: 560px;
          max-height: 90vh;
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-light);
          flex-shrink: 0;
        }

        .modal-header h2 {
          font-size: 1.25rem;
        }

        .close-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-tertiary);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .close-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .modal-body {
          padding: 1.5rem;
          overflow-y: auto;
        }

        .detail-section {
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-light);
        }

        .detail-section:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .detail-section h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }

        .booking-id-full {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          font-family: monospace;
          margin-top: 0.75rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
        }

        .detail-label {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.875rem;
          color: var(--text-tertiary);
        }

        .detail-value {
          font-weight: 500;
          color: var(--text-primary);
        }

        .detail-value.rent {
          color: var(--accent-primary);
          font-weight: 600;
        }

        .modal-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          padding: 1.5rem;
          border-top: 1px solid var(--border-light);
          flex-shrink: 0;
        }

        @media (max-width: 640px) {
          .bookings-grid {
            grid-template-columns: 1fr;
          }

          .booking-actions {
            flex-wrap: wrap;
          }

          .main-section-nav {
            flex-direction: column;
          }
          
          .section-tab {
            width: 100%;
          }

          .documents-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Main Section Navigation */
        .main-section-nav {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 2rem;
          background: var(--bg-card);
          padding: 0.5rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-light);
        }

        .section-tab {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.875rem 1.5rem;
          border-radius: var(--radius-lg);
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all var(--transition-fast);
          flex: 1;
          justify-content: center;
        }

        .section-tab:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .section-tab.active {
          background: var(--accent-gradient);
          color: white;
          box-shadow: var(--shadow-sm);
        }

        .badge-count {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.125rem 0.5rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .section-tab:not(.active) .badge-count {
          background: var(--error);
          color: white;
        }

        /* Document Verification Styles */
        .documents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1rem;
        }

        .document-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-xl);
          padding: 1.25rem;
          transition: all var(--transition-normal);
        }

        .document-card:hover {
          border-color: var(--accent-primary);
          box-shadow: var(--shadow-md);
        }

        .document-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .document-id {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          font-family: monospace;
        }

        .document-type {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-light);
        }

        .document-type svg {
          color: var(--accent-primary);
        }

        .document-user {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .document-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
          color: var(--text-tertiary);
          margin-bottom: 1rem;
        }

        .document-actions {
          display: flex;
          gap: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-light);
        }

        .document-actions button {
          flex: 1;
        }

        /* Document Modal Styles */
        .document-modal {
          max-width: 640px;
        }

        .document-id-full {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          font-family: monospace;
          margin-top: 0.75rem;
        }

        .document-type-display {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .document-type-display svg {
          color: var(--accent-primary);
        }

        .document-preview {
          background: var(--bg-tertiary);
          border-radius: var(--radius-lg);
          padding: 1rem;
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .document-image {
          max-width: 100%;
          max-height: 400px;
          object-fit: contain;
          border-radius: var(--radius-md);
        }

        .pdf-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          color: var(--text-tertiary);
        }

        .pdf-preview svg {
          color: var(--accent-primary);
        }

        .download-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--accent-primary);
          color: white;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          transition: all var(--transition-fast);
        }

        .download-link:hover {
          background: var(--accent-secondary);
        }

        .rejection-input {
          width: 100%;
          padding: 0.75rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 0.875rem;
          resize: vertical;
          min-height: 80px;
        }

        .rejection-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        .rejection-input::placeholder {
          color: var(--text-tertiary);
        }

        .stat-icon.info {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }

        /* Analytics Styles */
        .analytics-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1.5rem;
        }

        .analytics-card {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .analytics-card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .analytics-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-lg);
          background: var(--bg-tertiary);
          color: var(--text-secondary);
        }

        .analytics-icon.users {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }

        .analytics-icon.properties {
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }

        .analytics-icon.bookings {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .analytics-icon.revenue {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        .analytics-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .analytics-value-large {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .analytics-detail {
          font-size: 0.8125rem;
          color: var(--text-tertiary);
        }

        .analytics-breakdown {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .breakdown-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }

        .breakdown-item.confirmed {
          color: var(--success);
        }

        .breakdown-item.pending {
          color: var(--warning);
        }

        /* Chart Styles */
        .chart-card {
          margin-top: 0;
        }

        .charts-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        .chart-container {
          padding: 1rem 0;
        }

        .bar-chart {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          height: 180px;
          gap: 0.5rem;
          padding: 1rem 0;
        }

        .bar-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
          max-width: 60px;
        }

        .bar-wrapper {
          width: 100%;
          height: 140px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .bar {
          width: 100%;
          max-width: 36px;
          background: linear-gradient(180deg, #8b5cf6, #3b82f6);
          border-radius: var(--radius-md) var(--radius-md) 0 0;
          position: relative;
          min-height: 4px;
          transition: height 0.5s ease;
        }

        .bar.bar-gradient-green {
          background: linear-gradient(180deg, #10b981, #059669);
        }

        .bar.bar-gradient-gold {
          background: linear-gradient(180deg, #f59e0b, #d97706);
        }

        .bar-value {
          position: absolute;
          top: -22px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.625rem;
          font-weight: 600;
          color: var(--text-secondary);
          white-space: nowrap;
        }

        .bar-label {
          font-size: 0.6875rem;
          color: var(--text-tertiary);
          font-weight: 500;
        }

        /* Top Properties */
        .top-properties-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .top-property-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          transition: all var(--transition-fast);
        }

        .top-property-item:hover {
          background: var(--bg-tertiary);
        }

        .rank {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-gradient);
          color: white;
          border-radius: var(--radius-md);
          font-weight: 700;
          font-size: 0.875rem;
        }

        .top-property-item .property-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .top-property-item .property-title {
          font-weight: 600;
          color: var(--text-primary);
        }

        .top-property-item .property-meta {
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }

        .booking-count {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.125rem;
        }

        .booking-count .count {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--accent-primary);
        }

        .booking-count .label {
          font-size: 0.6875rem;
          color: var(--text-tertiary);
        }

        .property-rating {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--warning);
          font-weight: 600;
        }

        /* Activity Lists */
        .activity-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
        }

        .activity-avatar {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-gradient);
          color: white;
          border-radius: var(--radius-full);
          font-weight: 600;
          font-size: 1rem;
        }

        .activity-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          min-width: 0;
        }

        .activity-title {
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .activity-meta {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .no-activity {
          text-align: center;
          color: var(--text-tertiary);
          padding: 2rem;
        }

        @media (max-width: 768px) {
          .charts-row,
          .activity-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
