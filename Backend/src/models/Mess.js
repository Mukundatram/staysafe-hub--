const mongoose = require('mongoose');

const messSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    required: true
  },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  address: {
    type: String,
    default: ''
  },
  contactPhone: {
    type: String,
    required: true
  },
  contactEmail: {
    type: String
  },
  // Meal types offered
  mealTypes: [{
    type: String,
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'All Meals', 'breakfast', 'lunch', 'dinner', 'snacks']
  }],
  // Cuisine type
  cuisineType: [{
    type: String,
    enum: ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Jain', 'North Indian', 'South Indian', 'Chinese', 'Multi-Cuisine', 'Gujarati', 'Maharashtrian', 'Rajasthani', 'Bengali', 'Continental']
  }],
  // Menu items
  menu: {
    breakfast: [{ type: String }],
    lunch: [{ type: String }],
    dinner: [{ type: String }],
    snacks: [{ type: String }]
  },
  // Weekly menu (optional detailed menu)
  weeklyMenu: {
    monday: { breakfast: String, lunch: String, dinner: String },
    tuesday: { breakfast: String, lunch: String, dinner: String },
    wednesday: { breakfast: String, lunch: String, dinner: String },
    thursday: { breakfast: String, lunch: String, dinner: String },
    friday: { breakfast: String, lunch: String, dinner: String },
    saturday: { breakfast: String, lunch: String, dinner: String },
    sunday: { breakfast: String, lunch: String, dinner: String }
  },
  // Pricing plans
  pricing: {
    monthly: {
      allMeals: { type: Number }, // All 3 meals
      twoMeals: { type: Number }, // Any 2 meals
      oneMeal: { type: Number },  // Any 1 meal
      breakfast: { type: Number },
      lunch: { type: Number },
      dinner: { type: Number }
    },
    daily: {
      breakfast: { type: Number },
      lunch: { type: Number },
      dinner: { type: Number }
    }
  },
  // Timings
  timings: {
    breakfast: { start: String, end: String },
    lunch: { start: String, end: String },
    dinner: { start: String, end: String }
  },
  // Features/Amenities
  features: [{
    type: String,
    enum: [
      'Home Delivery',
      'Takeaway',
      'Dine-in',
      'AC Dining',
      'Pure Veg',
      'Hygiene Certified',
      'Weekly Menu Change',
      'Special Diet Options',
      'Tiffin Service',
      'Student Discount',
      'Trial Meal Available',
      'Flexible Plans',
      'homeDelivery',
      'pureVeg',
      'jainFood',
      'customizable',
      'hygienic',
      'affordablePricing',
      'home Delivery',
      'pure Veg',
      'jain Food',
      'affordable Pricing'
    ]
  }],
  // Images
  images: [{
    type: String
  }],
  // Ratings and Reviews
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  // Subscribers count
  subscribersCount: {
    type: Number,
    default: 0
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  // Capacity
  maxSubscribers: {
    type: Number,
    default: 100
  },
  currentSubscribers: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Text index for search
messSchema.index({ name: 'text', description: 'text', location: 'text' });

// Index for filtering
messSchema.index({ location: 1, isActive: 1, averageRating: -1 });

module.exports = mongoose.model('Mess', messSchema);
