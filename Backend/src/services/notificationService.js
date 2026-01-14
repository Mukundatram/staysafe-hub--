const Notification = require('../models/Notification');
const { sendEmail } = require('./emailService');

// Create notification and optionally send email
const createNotification = async ({
  userId,
  type,
  title,
  message,
  link = null,
  metadata = {},
  sendEmailNotification = true,
  emailTo = null,
  emailData = {}
}) => {
  try {
    // Create in-app notification
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      link,
      metadata
    });

    // Send email notification if enabled and email is provided
    if (sendEmailNotification && emailTo) {
      await sendEmail(emailTo, type, emailData);
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Notification creators for different events
const notificationService = {
  // When a student requests a booking
  async bookingRequested(booking, property, student, owner) {
    const startDateStr = new Date(booking.startDate).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const endDateStr = new Date(booking.endDate).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return createNotification({
      userId: owner._id,
      type: 'booking_request',
      title: 'New Booking Request',
      message: `${student.name} has requested to book "${property.title}"`,
      link: '/dashboard',
      metadata: {
        propertyId: property._id,
        bookingId: booking._id,
        senderId: student._id
      },
      sendEmailNotification: true,
      emailTo: owner.email,
      emailData: {
        ownerName: owner.name,
        studentName: student.name,
        propertyTitle: property.title,
        startDate: startDateStr,
        endDate: endDateStr
      }
    });
  },

  // When owner approves a booking
  async bookingApproved(booking, property, student, owner) {
    const startDateStr = new Date(booking.startDate).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const endDateStr = new Date(booking.endDate).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return createNotification({
      userId: student._id,
      type: 'booking_approved',
      title: 'Booking Approved! 🎉',
      message: `Your booking for "${property.title}" has been approved`,
      link: '/dashboard',
      metadata: {
        propertyId: property._id,
        bookingId: booking._id,
        senderId: owner._id
      },
      sendEmailNotification: true,
      emailTo: student.email,
      emailData: {
        studentName: student.name,
        ownerName: owner.name,
        propertyTitle: property.title,
        startDate: startDateStr,
        endDate: endDateStr
      }
    });
  },

  // When owner rejects a booking
  async bookingRejected(booking, property, student, owner) {
    return createNotification({
      userId: student._id,
      type: 'booking_rejected',
      title: 'Booking Not Approved',
      message: `Your booking for "${property.title}" was not approved`,
      link: '/properties',
      metadata: {
        propertyId: property._id,
        bookingId: booking._id,
        senderId: owner._id
      },
      sendEmailNotification: true,
      emailTo: student.email,
      emailData: {
        studentName: student.name,
        propertyTitle: property.title
      }
    });
  },

  // When student cancels a booking
  async bookingCancelled(booking, property, student, owner) {
    return createNotification({
      userId: owner._id,
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      message: `${student.name} has cancelled their booking for "${property.title}"`,
      link: '/dashboard',
      metadata: {
        propertyId: property._id,
        bookingId: booking._id,
        senderId: student._id
      },
      sendEmailNotification: true,
      emailTo: owner.email,
      emailData: {
        ownerName: owner.name,
        studentName: student.name,
        propertyTitle: property.title
      }
    });
  },

  // When student leaves/completes stay
  async bookingCompleted(booking, property, student, owner, reason = '') {
    return createNotification({
      userId: owner._id,
      type: 'booking_completed',
      title: 'Stay Completed',
      message: `${student.name} has ended their stay at "${property.title}"`,
      link: '/dashboard',
      metadata: {
        propertyId: property._id,
        bookingId: booking._id,
        senderId: student._id
      },
      sendEmailNotification: true,
      emailTo: owner.email,
      emailData: {
        ownerName: owner.name,
        studentName: student.name,
        propertyTitle: property.title,
        reason
      }
    });
  },

  // When a new message is received
  async newMessage(sender, recipient, property, messageContent) {
    const messagePreview = messageContent.length > 100 
      ? messageContent.substring(0, 100) + '...' 
      : messageContent;

    return createNotification({
      userId: recipient._id,
      type: 'new_message',
      title: `New message from ${sender.name}`,
      message: messagePreview,
      link: '/dashboard',
      metadata: {
        propertyId: property._id,
        senderId: sender._id
      },
      sendEmailNotification: true,
      emailTo: recipient.email,
      emailData: {
        recipientName: recipient.name,
        senderName: sender.name,
        propertyTitle: property.title,
        messagePreview
      }
    });
  },

  // Get user's notifications
  async getUserNotifications(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Notification.countDocuments({ user: userId });
    
    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  // Get unread count
  async getUnreadCount(userId) {
    return await Notification.countDocuments({ user: userId, read: false });
  },

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { read: true },
      { new: true }
    );
  },

  // Mark all as read
  async markAllAsRead(userId) {
    return await Notification.updateMany(
      { user: userId, read: false },
      { read: true }
    );
  },

  // Delete notification
  async deleteNotification(notificationId, userId) {
    return await Notification.findOneAndDelete({
      _id: notificationId,
      user: userId
    });
  }
};

module.exports = notificationService;
