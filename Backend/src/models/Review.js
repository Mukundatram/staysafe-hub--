const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  // Individual ratings for different aspects
  ratings: {
    cleanliness: { type: Number, min: 1, max: 5 },
    location: { type: Number, min: 1, max: 5 },
    value: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    amenities: { type: Number, min: 1, max: 5 }
  },
  // Owner's response to the review
  ownerResponse: {
    comment: { type: String, maxlength: 500 },
    respondedAt: { type: Date }
  },
  isVerified: {
    type: Boolean,
    default: true // Verified because linked to a completed booking
  },
  helpfulVotes: {
    type: Number,
    default: 0
  },
  reportedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Ensure one review per booking
reviewSchema.index({ booking: 1 }, { unique: true });
// Index for efficient property reviews lookup
reviewSchema.index({ property: 1, createdAt: -1 });
// Index for user's reviews
reviewSchema.index({ student: 1, createdAt: -1 });

// Static method to calculate average rating for a property
reviewSchema.statics.calculateAverageRating = async function(propertyId) {
  const stats = await this.aggregate([
    { $match: { property: propertyId } },
    {
      $group: {
        _id: '$property',
        avgRating: { $avg: '$rating' },
        numReviews: { $sum: 1 },
        avgCleanliness: { $avg: '$ratings.cleanliness' },
        avgLocation: { $avg: '$ratings.location' },
        avgValue: { $avg: '$ratings.value' },
        avgCommunication: { $avg: '$ratings.communication' },
        avgAmenities: { $avg: '$ratings.amenities' }
      }
    }
  ]);

  if (stats.length > 0) {
    const Property = mongoose.model('Property');
    await Property.findByIdAndUpdate(propertyId, {
      averageRating: Math.round(stats[0].avgRating * 10) / 10,
      reviewCount: stats[0].numReviews,
      ratingBreakdown: {
        cleanliness: Math.round(stats[0].avgCleanliness * 10) / 10 || 0,
        location: Math.round(stats[0].avgLocation * 10) / 10 || 0,
        value: Math.round(stats[0].avgValue * 10) / 10 || 0,
        communication: Math.round(stats[0].avgCommunication * 10) / 10 || 0,
        amenities: Math.round(stats[0].avgAmenities * 10) / 10 || 0
      }
    });
  } else {
    const Property = mongoose.model('Property');
    await Property.findByIdAndUpdate(propertyId, {
      averageRating: 0,
      reviewCount: 0,
      ratingBreakdown: {
        cleanliness: 0,
        location: 0,
        value: 0,
        communication: 0,
        amenities: 0
      }
    });
  }
};

// Update property rating after save
reviewSchema.post('save', function() {
  this.constructor.calculateAverageRating(this.property);
});

// Update property rating after remove
reviewSchema.post('remove', function() {
  this.constructor.calculateAverageRating(this.property);
});

module.exports = mongoose.model('Review', reviewSchema);
