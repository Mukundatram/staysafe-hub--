import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  HiOutlineBell, 
  HiOutlineCheck, 
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineChatAlt2,
  HiOutlineHome,
  HiOutlineCalendar
} from 'react-icons/hi';
import { notificationService } from '../../services/propertyService';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch notifications and unread count
  const fetchNotifications = async () => {
    try {
      const [notifResponse, countResponse] = await Promise.all([
        notificationService.getAll(1, 10),
        notificationService.getUnreadCount()
      ]);
      setNotifications(notifResponse.notifications || []);
      setUnreadCount(countResponse.count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read) {
        await notificationService.markAsRead(notification._id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => 
          prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
        );
      }
      if (notification.link) {
        navigate(notification.link);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete notification
  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    try {
      await notificationService.delete(notificationId);
      const deletedNotif = notifications.find(n => n._id === notificationId);
      if (deletedNotif && !deletedNotif.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_request':
        return <HiOutlineCalendar className="notif-icon booking" />;
      case 'booking_approved':
        return <HiOutlineCheckCircle className="notif-icon approved" />;
      case 'booking_rejected':
        return <HiOutlineXCircle className="notif-icon rejected" />;
      case 'booking_cancelled':
        return <HiOutlineXCircle className="notif-icon cancelled" />;
      case 'booking_completed':
        return <HiOutlineHome className="notif-icon completed" />;
      case 'new_message':
        return <HiOutlineChatAlt2 className="notif-icon message" />;
      default:
        return <HiOutlineBell className="notif-icon default" />;
    }
  };

  return (
    <div className="notification-bell-wrapper" ref={dropdownRef}>
      <button 
        className="notification-bell-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <HiOutlineBell size={22} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="notification-dropdown"
          >
            <div className="notification-header">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  className="mark-all-read"
                  onClick={handleMarkAllRead}
                  disabled={loading}
                >
                  <HiOutlineCheck size={16} />
                  Mark all read
                </button>
              )}
            </div>

            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="notification-empty">
                  <HiOutlineBell size={40} />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon-wrapper">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <p className="notification-title">{notification.title}</p>
                      <p className="notification-message">{notification.message}</p>
                      <span className="notification-time">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <button 
                      className="notification-delete"
                      onClick={(e) => handleDelete(e, notification._id)}
                      aria-label="Delete notification"
                    >
                      <HiOutlineTrash size={16} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="notification-footer">
                <button 
                  className="view-all-btn"
                  onClick={() => {
                    navigate('/notifications');
                    setIsOpen(false);
                  }}
                >
                  View all notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .notification-bell-wrapper {
          position: relative;
        }

        .notification-bell-trigger {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: var(--bg-secondary);
          border: none;
          cursor: pointer;
          color: var(--text-secondary);
          transition: all 0.2s ease;
        }

        .notification-bell-trigger:hover {
          color: var(--primary);
          background: var(--bg-tertiary);
        }

        .notification-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          font-size: 10px;
          font-weight: 600;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
        }

        .notification-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 380px;
          max-height: 500px;
          background: var(--bg-primary);
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          border: 1px solid var(--border-color);
          overflow: hidden;
          z-index: 1000;
        }

        .notification-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color);
        }

        .notification-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .mark-all-read {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: var(--bg-secondary);
          border: none;
          border-radius: 8px;
          font-size: 12px;
          color: var(--primary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mark-all-read:hover {
          background: var(--primary);
          color: white;
        }

        .mark-all-read:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .notification-list {
          max-height: 380px;
          overflow-y: auto;
        }

        .notification-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: var(--text-muted);
        }

        .notification-empty p {
          margin-top: 12px;
          font-size: 14px;
        }

        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 1px solid var(--border-color);
          position: relative;
        }

        .notification-item:hover {
          background: var(--bg-secondary);
        }

        .notification-item.unread {
          background: rgba(99, 102, 241, 0.05);
        }

        .notification-item.unread::before {
          content: '';
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          background: var(--primary);
          border-radius: 50%;
        }

        .notification-icon-wrapper {
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
        }

        .notif-icon {
          font-size: 18px;
        }

        .notif-icon.booking { color: #f59e0b; }
        .notif-icon.approved { color: #10b981; }
        .notif-icon.rejected { color: #ef4444; }
        .notif-icon.cancelled { color: #f97316; }
        .notif-icon.completed { color: #6366f1; }
        .notif-icon.message { color: #3b82f6; }
        .notif-icon.default { color: var(--text-secondary); }

        .notification-content {
          flex: 1;
          min-width: 0;
        }

        .notification-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 4px 0;
          line-height: 1.3;
        }

        .notification-message {
          font-size: 12px;
          color: var(--text-secondary);
          margin: 0 0 6px 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .notification-time {
          font-size: 11px;
          color: var(--text-muted);
        }

        .notification-delete {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          border-radius: 6px;
          color: var(--text-muted);
          cursor: pointer;
          opacity: 0;
          transition: all 0.2s ease;
        }

        .notification-item:hover .notification-delete {
          opacity: 1;
        }

        .notification-delete:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .notification-footer {
          padding: 12px 20px;
          border-top: 1px solid var(--border-color);
        }

        .view-all-btn {
          width: 100%;
          padding: 10px;
          background: var(--bg-secondary);
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          color: var(--primary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .view-all-btn:hover {
          background: var(--primary);
          color: white;
        }

        @media (max-width: 480px) {
          .notification-dropdown {
            width: calc(100vw - 20px);
            right: -60px;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;
