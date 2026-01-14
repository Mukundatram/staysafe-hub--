const mongoose = require('mongoose');

const messSubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mess: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mess',
    required: true
  },
  // Subscription plan
  plan: {
    type: String,
    enum: ['monthly-all', 'monthly-two', 'monthly-one', 'monthly-breakfast', 'monthly-lunch', 'monthly-dinner', 'daily', 'daily-all', 'daily-two', 'daily-one'],
    required: true
  },
  // Selected meals for flexible plans
  selectedMeals: [{
    type: String,
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'breakfast', 'lunch', 'dinner', 'snacks']
  }],
  // Subscription period
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  // Pricing
  amount: {
    type: Number,
    required: true
  },
  // Status
  status: {
    type: String,
    enum: ['Active', 'Expired', 'Cancelled', 'Pending'],
    default: 'Pending'
  },
  // Payment status
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  // Auto-renew
  autoRenew: {
    type: Boolean,
    default: false
  },
  // Delivery preference
  deliveryAddress: {
    type: String
  },
  deliveryPreference: {
    type: String,
    enum: ['Delivery', 'Pickup', 'Dine-in', 'delivery', 'pickup', 'dine-in'],
    default: 'Pickup'
  },
  // Special instructions
  specialInstructions: {
    type: String
  }
}, {
  timestamps: true
});

// Compound index
messSubscriptionSchema.index({ user: 1, mess: 1, status: 1 });

module.exports = mongoose.model('MessSubscription', messSubscriptionSchema);
