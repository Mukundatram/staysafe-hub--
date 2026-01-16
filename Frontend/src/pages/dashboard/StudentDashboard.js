import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authService, bookingService } from '../../services/propertyService';
import messService from '../../services/messService';
import { useAuth } from '../../context/AuthContext';
import Loading from '../../components/ui/Loading';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import ChatModal from '../../components/chat/ChatModal';
import { ReviewModal } from '../../components/review';
import { reviewService } from '../../services/propertyService';
import documentService from '../../services/documentService';
import { format } from 'date-fns';
import {
  HiOutlineHome,
  HiOutlineCalendar,
  HiOutlineLocationMarker,
  HiOutlineBell,
  HiOutlineExclamationCircle,
  HiOutlineShieldCheck,
  HiOutlinePhone,
  HiOutlineChatAlt2,
  HiOutlineStar,
  HiOutlineClipboardList,
  HiOutlineLogout,
  HiOutlineX,
  HiOutlineBadgeCheck,
  HiOutlineArrowRight
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { connectSocket } from '../../services/socket';

const StudentDashboard = () => {
  useAuth(); // Ensure user is authenticated
  const [dashboardData, setDashboardData] = useState(null);
  const [messSubscriptions, setMessSubscriptions] = useState([]);
  const [messLoading, setMessLoading] = useState(true);
    // Fetch user's mess subscriptions
    const fetchMessSubscriptions = useCallback(async () => {
      try {
        setMessLoading(true);
        const response = await messService.getMySubscriptions();
        setMessSubscriptions(response.data || []);
      } catch (err) {
        console.error('Failed to fetch mess subscriptions:', err);
        toast.error('Failed to load mess subscriptions');
      } finally {
        setMessLoading(false);
      }
    }, []);

  const [loading, setLoading] = useState(true);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedChatData, setSelectedChatData] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [leavingRoom, setLeavingRoom] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  const [reviewedBookings, setReviewedBookings] = useState(new Set());
  const [verificationStatus, setVerificationStatus] = useState(null);

  const fetchVerificationStatus = useCallback(async () => {
    try {
      const response = await documentService.getVerificationStatus();
      setVerificationStatus(response.verificationStatus);
    } catch (err) {
      console.error('Failed to fetch verification status:', err);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchVerificationStatus();
    fetchMessSubscriptions();
    // Connect socket and listen for mess subscription events
    let socket;
    try {
      socket = connectSocket();
      if (socket) {
        socket.on('mess:subscription:created', (payload) => {
          console.log('socket mess:subscription:created', payload);
          toast.success('Your mess subscription request was received');
          fetchMessSubscriptions();
        });
        socket.on('mess:subscription:cancelled', (payload) => {
          console.log('socket mess:subscription:cancelled', payload);
          toast('A mess subscription was cancelled');
          fetchMessSubscriptions();
        });
        socket.on('mess:subscription:approved', (payload) => {
          console.log('socket mess:subscription:approved', payload);
          toast.success('Your mess subscription was approved');
          fetchMessSubscriptions();
        });
      }
    } catch (e) {
      console.error('Socket init error (student):', e);
    }

    return () => {
      if (socket) {
        socket.off('mess:subscription:created');
        socket.off('mess:subscription:cancelled');
        socket.off('mess:subscription:approved');
      }
    };
  }, [fetchVerificationStatus, fetchMessSubscriptions]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await authService.getStudentDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSOS = () => {
    toast.success('Emergency services have been notified. Help is on the way!');
    // In production, this would trigger actual emergency services
  };

  const handleOpenChat = (booking) => {
    if (booking?.property?.owner) {
      setSelectedChatData({
        property: booking.property,
        ownerId: booking.property.owner._id,
        ownerName: booking.property.owner.name
      });
      setChatModalOpen(true);
    } else {
      toast.error('Owner information not available');
    }
  };

  const handleCloseChat = () => {
    setChatModalOpen(false);
    setSelectedChatData(null);
  };

  const handleLeaveRoom = async () => {
    const activeBooking = dashboardData?.bookings?.find(b => b.status === 'Confirmed');
    if (!activeBooking) {
      toast.error('No active booking found');
      return;
    }

    try {
      setLeavingRoom(true);
      await bookingService.leaveRoom(activeBooking._id, leaveReason);
      toast.success('You have successfully left the room. The property is now available.');
      setShowLeaveModal(false);
      setLeaveReason('');
      fetchDashboardData(); // Refresh data
    } catch (err) {
      console.error('Failed to leave room:', err);
      toast.error(err.response?.data?.message || 'Failed to leave room');
    } finally {
      setLeavingRoom(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await bookingService.cancelBooking(bookingId);
      toast.success('Booking cancelled successfully');
      fetchDashboardData(); // Refresh data
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const handleOpenReviewModal = async (booking) => {
    try {
      // Check if user can review this booking
      const canReviewResult = await reviewService.canReview(booking._id);
      if (!canReviewResult.canReview) {
        toast.error(canReviewResult.message || 'You cannot review this booking');
        return;
      }
      setSelectedBookingForReview(booking);
      setReviewModalOpen(true);
    } catch (err) {
      console.error('Error checking review eligibility:', err);
      toast.error('Unable to check review eligibility');
    }
  };

  const handleCloseReviewModal = () => {
    setReviewModalOpen(false);
    setSelectedBookingForReview(null);
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Confirmed': return 'success';
      case 'Pending': return 'warning';
      case 'Rejected': return 'error';
      case 'Completed': return 'info';
      case 'Cancelled': return 'error';
      default: return 'info';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="container">
          <Loading size="lg" text="Loading your dashboard..." />
        </div>
      </div>
    );
  }

  const { student, bookings = [] } = dashboardData || {};
  const activeBooking = bookings.find(b => b.status === 'Confirmed');
  const pendingBookings = bookings.filter(b => b.status === 'Pending');

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
            <h1>Welcome back, {student || 'Student'}! 👋</h1>
            <p>Here's an overview of your stays and bookings.</p>
          </div>
          
          {/* SOS Button - Always visible */}
          <Button
            variant="danger"
            size="lg"
            onClick={handleSOS}
            leftIcon={<HiOutlinePhone size={20} />}
            className="sos-button"
          >
            Emergency SOS
          </Button>
        </motion.div>

        {/* Verification Status Card */}
        {verificationStatus && !verificationStatus.overall && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="verification-banner"
          >
            <Card padding="md" className="verification-status-card">
              <div className="verification-content">
                <div className="verification-icon">
                  <HiOutlineBadgeCheck size={32} />
                </div>
                <div className="verification-info">
                  <h3>Complete Your Verification</h3>
                  <p>
                    Verify your identity to unlock all features and build trust with property owners.
                  </p>
                  <div className="verification-progress">
                    <div className="progress-item">
                      <span className={verificationStatus.identity?.verified ? 'verified' : ''}>
                        {verificationStatus.identity?.verified ? '✓' : '○'} Identity
                      </span>
                    </div>
                    <div className="progress-item">
                      <span className={verificationStatus.address?.verified ? 'verified' : ''}>
                        {verificationStatus.address?.verified ? '✓' : '○'} Address
                      </span>
                    </div>
                  </div>
                </div>
                <Link to="/verification">
                  <Button variant="primary" rightIcon={<HiOutlineArrowRight size={18} />}>
                    Verify Now
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        )}

        <div className="dashboard-grid">
          {/* Main Content */}
          <div className="dashboard-main">
            {/* Mess Subscriptions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
            >
              <Card padding="lg">
                <div className="card-header">
                  <h2>
                    <HiOutlineClipboardList size={24} />
                    My Mess Subscriptions
                  </h2>
                </div>
                {messLoading ? (
                  <Loading size="md" text="Loading mess subscriptions..." />
                ) : messSubscriptions.length === 0 ? (
                  <EmptyState
                    icon={HiOutlineClipboardList}
                    title="No mess subscriptions yet"
                    description="Subscribe to a mess/tiffin service to see it here."
                  />
                ) : (
                  <div className="mess-subs-list">
                    {messSubscriptions.map((sub, idx) => (
                      <motion.div
                        key={sub._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="mess-sub-item"
                      >
                        <div className="mess-sub-info">
                          <h4>{sub.mess?.name || 'Mess Service'}</h4>
                          <p>
                            <HiOutlineLocationMarker size={14} />{' '}
                            {sub.mess?.location || 'Location'}
                          </p>
                          <div className="mess-sub-meta">
                            <span className="meta-label">Plan:</span> {sub.plan}
                            {sub.selectedMeals?.length > 0 && (
                              <>
                                {' | '}<span className="meta-label">Meals:</span> {sub.selectedMeals.join(', ')}
                              </>
                            )}
                          </div>
                          <div className="mess-sub-meta">
                            <span className="meta-label">Status:</span>{' '}
                            <Badge variant={sub.status === 'Active' ? 'success' : sub.status === 'Pending' ? 'warning' : 'gray'}>
                              {sub.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="mess-sub-actions">
                          {/* Optionally add cancel button or details link */}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
                  <style>{`
                    .mess-subs-list {
                      display: flex;
                      flex-direction: column;
                      gap: 1rem;
                      margin-bottom: 2rem;
                    }
                    .mess-sub-item {
                      display: flex;
                      justify-content: space-between;
                      align-items: flex-start;
                      padding: 1rem 0;
                      border-bottom: 1px solid var(--border-light);
                    }
                    .mess-sub-info h4 {
                      font-size: 1rem;
                      margin-bottom: 0.25rem;
                    }
                    .mess-sub-info p {
                      display: flex;
                      align-items: center;
                      gap: 0.375rem;
                      color: var(--text-secondary);
                      font-size: 0.9375rem;
                    }
                    .mess-sub-meta {
                      font-size: 0.85rem;
                      color: var(--text-tertiary);
                      margin-top: 0.25rem;
                    }
                    .meta-label {
                      font-weight: 500;
                      color: var(--text-primary);
                    }
                  `}</style>
            {/* Active Stay */}
            {activeBooking && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card padding="lg" className="active-stay-card">
                  <div className="card-header">
                    <h2>
                      <HiOutlineHome size={24} />
                      My Current Stay
                    </h2>
                    <Badge variant="success">Active</Badge>
                  </div>

                  <div className="stay-details">
                    <div className="stay-property">
                      <img
                        src={activeBooking.property?.images?.[0] 
                          ? `http://localhost:4000${activeBooking.property.images[0]}`
                          : "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=150&h=100&fit=crop"}
                        alt={activeBooking.property?.title}
                      />
                      <div className="property-info">
                        <h3>{activeBooking.property?.title || 'Property'}</h3>
                        <p>
                          <HiOutlineLocationMarker size={16} />
                          {activeBooking.property?.location || 'Location'}
                        </p>
                      </div>
                    </div>

                    <div className="stay-meta">
                      <div className="meta-item">
                        <span className="meta-label">Move-in</span>
                        <span className="meta-value">
                          {format(new Date(activeBooking.startDate), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Move-out</span>
                        <span className="meta-value">
                          {format(new Date(activeBooking.endDate), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Monthly Rent</span>
                        <span className="meta-value">
                          ₹{activeBooking.property?.rent?.toLocaleString() || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="stay-actions">
                      <Button 
                        variant="outline" 
                        leftIcon={<HiOutlineChatAlt2 size={18} />}
                        onClick={() => handleOpenChat(activeBooking)}
                      >
                        Chat with Owner
                      </Button>
                      <Button 
                        variant="secondary" 
                        leftIcon={<HiOutlineStar size={18} />}
                        onClick={() => toast('You can leave a review after completing your stay', { icon: '📝' })}
                      >
                        Leave Review
                      </Button>
                      <Button 
                        variant="danger" 
                        leftIcon={<HiOutlineLogout size={18} />}
                        onClick={() => setShowLeaveModal(true)}
                      >
                        Leave Room
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Bookings List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card padding="lg">
                <div className="card-header">
                  <h2>
                    <HiOutlineClipboardList size={24} />
                    My Bookings
                  </h2>
                  <Link to="/properties" className="btn btn-sm btn-primary">
                    Book New Stay
                  </Link>
                </div>

                {bookings.length === 0 ? (
                  <EmptyState
                    icon={HiOutlineHome}
                    title="No bookings yet"
                    description="Start exploring verified properties and make your first booking."
                    action={{
                      label: 'Browse Properties',
                      onClick: () => window.location.href = '/properties',
                    }}
                  />
                ) : (
                  <div className="bookings-list">
                    {bookings.map((booking, index) => (
                      <motion.div
                        key={booking._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="booking-item"
                      >
                        <div className="booking-property">
                          <div className="property-thumb">
                            <HiOutlineHome size={24} />
                          </div>
                          <div className="property-details">
                            <h4>{booking.property?.title || 'Property'}</h4>
                            <p>
                              <HiOutlineCalendar size={14} />
                              {format(new Date(booking.startDate), 'MMM d')} - {format(new Date(booking.endDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="booking-status">
                          <Badge variant={getStatusVariant(booking.status)}>
                            {booking.status}
                          </Badge>
                          <span className="booking-rent">
                            ₹{booking.property?.rent?.toLocaleString() || 'N/A'}/mo
                          </span>
                          {booking.status === 'Pending' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleCancelBooking(booking._id)}
                              className="cancel-btn"
                            >
                              Cancel
                            </Button>
                          )}
                          {booking.status === 'Completed' && !reviewedBookings.has(booking._id) && (
                            <Button 
                              variant="primary" 
                              size="sm"
                              onClick={() => handleOpenReviewModal(booking)}
                              leftIcon={<HiOutlineStar size={14} />}
                              className="review-btn"
                            >
                              Write Review
                            </Button>
                          )}
                          {booking.status === 'Completed' && reviewedBookings.has(booking._id) && (
                            <Badge variant="success">
                              <HiOutlineStar size={12} /> Reviewed
                            </Badge>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="dashboard-sidebar">
            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card padding="md">
                <h3 className="sidebar-title">Quick Stats</h3>
                <div className="stats-list">
                  <div className="stat-item">
                    <div className="stat-icon">
                      <HiOutlineHome size={20} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-value">{bookings.length}</span>
                      <span className="stat-label">Total Bookings</span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon pending">
                      <HiOutlineCalendar size={20} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-value">{pendingBookings.length}</span>
                      <span className="stat-label">Pending</span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon success">
                      <HiOutlineShieldCheck size={20} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-value">{activeBooking ? 1 : 0}</span>
                      <span className="stat-label">Active Stay</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Notifications */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card padding="md">
                <h3 className="sidebar-title">
                  <HiOutlineBell size={18} />
                  Notifications
                </h3>
                <div className="notifications-list">
                  {pendingBookings.length > 0 && (
                    <div className="notification-item warning">
                      <HiOutlineExclamationCircle size={18} />
                      <p>You have {pendingBookings.length} pending booking(s) awaiting approval.</p>
                    </div>
                  )}
                  <div className="notification-item">
                    <HiOutlineShieldCheck size={18} />
                    <p>Your verification is complete. You can now book properties.</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Safety Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card padding="md" variant="gradient">
                <h3 className="safety-title">
                  <HiOutlineShieldCheck size={20} />
                  Safety First
                </h3>
                <p className="safety-text">
                  In case of emergency, use the SOS button. We'll immediately alert 
                  local authorities and your emergency contacts.
                </p>
                <Button 
                  variant="danger" 
                  size="sm" 
                  fullWidth 
                  onClick={handleSOS}
                  leftIcon={<HiOutlinePhone size={16} />}
                >
                  Emergency SOS
                </Button>
              </Card>
            </motion.div>
          </div>
        </div>
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

        .sos-button {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
        }

        .verification-banner {
          margin-bottom: 1.5rem;
        }

        .verification-status-card {
          background: linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%);
          border: 1px solid var(--primary-200);
        }

        .dark .verification-status-card {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.2) 100%);
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .verification-content {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .verification-icon {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--primary);
          color: white;
          border-radius: var(--radius-lg);
        }

        .verification-info {
          flex: 1;
          min-width: 200px;
        }

        .verification-info h3 {
          font-size: 1.125rem;
          margin-bottom: 0.25rem;
          color: var(--text-primary);
        }

        .verification-info p {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }

        .verification-progress {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
        }

        .progress-item span {
          color: var(--text-secondary);
        }

        .progress-item span.verified {
          color: var(--success);
          font-weight: 500;
        }

        .dashboard-grid {
          display: grid;
          gap: 2rem;
        }

        @media (min-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr 340px;
          }
        }

        .dashboard-main {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
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

        /* Active Stay Card */
        .stay-details {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .stay-property {
          display: flex;
          gap: 1rem;
        }

        .stay-property img {
          width: 120px;
          height: 80px;
          object-fit: cover;
          border-radius: var(--radius-md);
        }

        .property-info h3 {
          font-size: 1.125rem;
          margin-bottom: 0.5rem;
        }

        .property-info p {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          color: var(--text-secondary);
          font-size: 0.9375rem;
        }

        .stay-meta {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
          padding: 1rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
        }

        .meta-item {
          display: flex;
          flex-direction: column;
        }

        .meta-label {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }

        .meta-value {
          font-weight: 600;
          color: var(--text-primary);
        }

        .stay-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        /* Bookings List */
        .bookings-list {
          display: flex;
          flex-direction: column;
        }

        .booking-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 1rem 0;
          border-bottom: 1px solid var(--border-light);
        }

        .booking-item:last-child {
          border-bottom: none;
        }

        .booking-property {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .property-thumb {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          color: var(--text-tertiary);
        }

        .property-details h4 {
          font-size: 0.9375rem;
          margin-bottom: 0.25rem;
        }

        .property-details p {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          color: var(--text-tertiary);
        }

        .booking-status {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.375rem;
        }

        .booking-rent {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .review-btn {
          margin-top: 0.25rem;
        }

        .booking-status .badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        /* Sidebar */
        .dashboard-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .sidebar-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          margin-bottom: 1rem;
        }

        .stats-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
        }

        .stat-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
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

        .stat-content {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }

        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .notification-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }

        .notification-item.warning {
          background: var(--warning-bg);
          color: var(--warning);
        }

        .notification-item svg {
          flex-shrink: 0;
          margin-top: 2px;
        }

        /* Safety Card */
        .safety-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          margin-bottom: 0.75rem;
        }

        .safety-text {
          font-size: 0.875rem;
          line-height: 1.6;
          margin-bottom: 1rem;
          opacity: 0.9;
        }

        .leave-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .leave-modal {
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 450px;
          box-shadow: var(--shadow-xl);
          border: 1px solid var(--border-light);
          overflow: hidden;
        }

        .leave-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem;
          border-bottom: 1px solid var(--border-light);
          background: var(--error-bg);
        }

        .leave-modal-header h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.125rem;
          color: var(--error);
        }

        .leave-modal-close {
          background: none;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: var(--radius-sm);
        }

        .leave-modal-close:hover {
          color: var(--text-primary);
          background: var(--bg-tertiary);
        }

        .leave-modal-body {
          padding: 1.5rem;
        }

        .leave-modal-body p {
          color: var(--text-secondary);
          margin-bottom: 1rem;
          line-height: 1.6;
        }

        .leave-reason-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 0.875rem;
          resize: vertical;
          min-height: 80px;
        }

        .leave-reason-input:focus {
          outline: none;
          border-color: var(--accent-primary);
        }

        .leave-modal-footer {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border-light);
          background: var(--bg-secondary);
        }

        .booking-actions-inline {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
      `}</style>

      {/* Chat Modal */}
      {selectedChatData && (
        <ChatModal
          isOpen={chatModalOpen}
          onClose={handleCloseChat}
          property={selectedChatData.property}
          ownerId={selectedChatData.ownerId}
          ownerName={selectedChatData.ownerName}
        />
      )}

      {/* Review Modal */}
      {selectedBookingForReview && (
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={handleCloseReviewModal}
          booking={selectedBookingForReview}
          onReviewSubmitted={() => {
            setReviewedBookings(prev => new Set([...prev, selectedBookingForReview._id]));
            handleCloseReviewModal();
          }}
        />
      )}

      {/* Leave Room Confirmation Modal */}
      <AnimatePresence>
        {showLeaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="leave-modal-overlay"
            onClick={() => setShowLeaveModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="leave-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="leave-modal-header">
                <h3>
                  <HiOutlineLogout size={24} />
                  Leave Room
                </h3>
                <button className="leave-modal-close" onClick={() => setShowLeaveModal(false)}>
                  <HiOutlineX size={20} />
                </button>
              </div>
              <div className="leave-modal-body">
                <p>
                  Are you sure you want to leave this room? This action will end your current stay 
                  and mark the property as available for other students.
                </p>
                <textarea
                  className="leave-reason-input"
                  placeholder="Reason for leaving (optional)"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                />
              </div>
              <div className="leave-modal-footer">
                <Button variant="outline" onClick={() => setShowLeaveModal(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="danger" 
                  onClick={handleLeaveRoom}
                  disabled={leavingRoom}
                >
                  {leavingRoom ? 'Leaving...' : 'Confirm Leave'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentDashboard;
