const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'booking_request',      // Owner receives when student requests booking
      'booking_approved',     // Student receives when owner approves
      'booking_rejected',     // Student receives when owner rejects
      'booking_cancelled',    // Owner receives when student cancels
      'booking_completed',    // Owner receives when student leaves room
      'new_message',          // When receiving a new chat message
      'payment_received',     // Owner receives when payment is made
      'system',               // System notifications
      'mess_subscription_created',  // Owner receives when student subscribes
      'mess_subscription_request',  // Owner receives when student requests subscription
      'mess_subscription_approved', // Student receives when owner approves
      'mess_subscription_rejected', // Student receives when owner rejects
      'mess_subscription_cancelled', // Owner receives when student cancels
      'document_verified',    // User receives when documents are verified
      'document_rejected'     // User receives when documents are rejected
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  link: {
    type: String,
    default: null
  },
  metadata: {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property'
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
