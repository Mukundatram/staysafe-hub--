import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  HiOutlineBell, 
  HiOutlineCheck, 
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineChatAlt2,
  HiOutlineHome,
  HiOutlineCalendar,
  HiOutlineChevronLeft,
  HiOutlineChevronRight
} from 'react-icons/hi';
import { notificationService } from '../services/propertyService';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const navigate = useNavigate();

  const fetchNotifications = async (page = 1) => {
    try {
      setLoading(true);
      const response = await notificationService.getAll(page, 15);
      setNotifications(response.notifications || []);
      setPagination(response.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read) {
        await notificationService.markAsRead(notification._id);
        setNotifications(prev => 
          prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
        );
      }
      if (notification.link) {
        navigate(notification.link);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    try {
      await notificationService.delete(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_request':
        return <HiOutlineCalendar className="notif-type-icon booking" />;
      case 'booking_approved':
        return <HiOutlineCheckCircle className="notif-type-icon approved" />;
      case 'booking_rejected':
        return <HiOutlineXCircle className="notif-type-icon rejected" />;
      case 'booking_cancelled':
        return <HiOutlineXCircle className="notif-type-icon cancelled" />;
      case 'booking_completed':
        return <HiOutlineHome className="notif-type-icon completed" />;
      case 'new_message':
        return <HiOutlineChatAlt2 className="notif-type-icon message" />;
      default:
        return <HiOutlineBell className="notif-type-icon default" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notifications-page">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="notifications-wrapper"
        >
          <div className="page-header">
            <div className="header-left">
              <h1>
                <HiOutlineBell size={28} />
                Notifications
              </h1>
              {pagination.total > 0 && (
                <span className="notification-count">
                  {pagination.total} total • {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={handleMarkAllRead}>
                <HiOutlineCheck size={18} />
                Mark all as read
              </button>
            )}
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="empty-state">
              <HiOutlineBell size={60} />
              <h2>No notifications</h2>
              <p>You're all caught up! Check back later for updates.</p>
            </div>
          ) : (
            <>
              <div className="notifications-list">
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`notification-card ${!notification.read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-body">
                      <h3>{notification.title}</h3>
                      <p>{notification.message}</p>
                      <div className="notification-meta">
                        <span className="notification-date">
                          {format(new Date(notification.createdAt), 'MMM d, yyyy • h:mm a')}
                        </span>
                        <span className="notification-relative">
                          ({formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })})
                        </span>
                      </div>
                    </div>
                    <div className="notification-actions">
                      {!notification.read && (
                        <span className="unread-indicator" title="Unread" />
                      )}
                      <button 
                        className="delete-btn"
                        onClick={(e) => handleDelete(e, notification._id)}
                        title="Delete"
                      >
                        <HiOutlineTrash size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {pagination.pages > 1 && (
                <div className="pagination">
                  <button 
                    className="page-btn"
                    disabled={pagination.page <= 1}
                    onClick={() => fetchNotifications(pagination.page - 1)}
                  >
                    <HiOutlineChevronLeft size={20} />
                    Previous
                  </button>
                  <span className="page-info">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button 
                    className="page-btn"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => fetchNotifications(pagination.page + 1)}
                  >
                    Next
                    <HiOutlineChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      <style>{`
        .notifications-page {
          min-height: calc(100vh - 80px);
          padding: 100px 0 60px;
          background: var(--bg-primary);
        }

        .notifications-wrapper {
          max-width: 800px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .page-header h1 {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 28px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .notification-count {
          font-size: 14px;
          color: var(--text-secondary);
          background: var(--bg-secondary);
          padding: 6px 14px;
          border-radius: 20px;
        }

        .mark-all-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mark-all-btn:hover {
          background: var(--primary-dark);
          transform: translateY(-2px);
        }

        .loading-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          text-align: center;
          color: var(--text-secondary);
        }

        .loading-state .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border-color);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state h2 {
          font-size: 20px;
          color: var(--text-primary);
          margin: 20px 0 8px;
        }

        .empty-state p {
          font-size: 14px;
        }

        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .notification-card {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px;
          background: var(--bg-secondary);
          border-radius: 16px;
          border: 1px solid var(--border-color);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .notification-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          border-color: var(--primary);
        }

        .notification-card.unread {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(99, 102, 241, 0.02) 100%);
          border-color: rgba(99, 102, 241, 0.2);
        }

        .notification-icon {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
        }

        .notif-type-icon {
          font-size: 24px;
        }

        .notif-type-icon.booking { color: #f59e0b; }
        .notif-type-icon.approved { color: #10b981; }
        .notif-type-icon.rejected { color: #ef4444; }
        .notif-type-icon.cancelled { color: #f97316; }
        .notif-type-icon.completed { color: #6366f1; }
        .notif-type-icon.message { color: #3b82f6; }
        .notif-type-icon.default { color: var(--text-secondary); }

        .notification-body {
          flex: 1;
          min-width: 0;
        }

        .notification-body h3 {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 6px;
        }

        .notification-body p {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0 0 10px;
          line-height: 1.5;
        }

        .notification-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .notification-date {
          font-size: 12px;
          color: var(--text-muted);
        }

        .notification-relative {
          font-size: 12px;
          color: var(--text-muted);
        }

        .notification-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .unread-indicator {
          width: 10px;
          height: 10px;
          background: var(--primary);
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(99, 102, 241, 0.4);
        }

        .delete-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s ease;
          opacity: 0;
        }

        .notification-card:hover .delete-btn {
          opacity: 1;
        }

        .delete-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin-top: 30px;
          padding-top: 30px;
          border-top: 1px solid var(--border-color);
        }

        .page-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          color: var(--text-primary);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .page-btn:hover:not(:disabled) {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-info {
          font-size: 14px;
          color: var(--text-secondary);
        }

        @media (max-width: 640px) {
          .notifications-page {
            padding: 80px 16px 40px;
          }

          .page-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .notification-card {
            padding: 16px;
          }

          .notification-icon {
            width: 40px;
            height: 40px;
          }

          .notif-type-icon {
            font-size: 20px;
          }

          .delete-btn {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationsPage;
