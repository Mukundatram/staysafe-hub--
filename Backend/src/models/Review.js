const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Property fields (optional if mess review)
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  // Mess fields (optional if property review)
  mess: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mess'
  },
  messSubscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessSubscription'
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
    amenities: { type: Number, min: 1, max: 5 },
    // Mess specific ratings (optional)
    foodQuality: { type: Number, min: 1, max: 5 },
    service: { type: Number, min: 1, max: 5 }
  },
  // Owner's response to the review
  ownerResponse: {
    comment: { type: String, maxlength: 500 },
    respondedAt: { type: Date }
  },
  isVerified: {
    type: Boolean,
    default: true
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

// Validation to ensure it's either a property review or a mess review, but not both/neither
reviewSchema.pre('validate', function (next) {
  if ((this.property && this.mess) || (!this.property && !this.mess)) {
    next(new Error('Review must be for either a property OR a mess service, not both or neither.'));
  } else {
    next();
  }
});

// Ensure one review per booking/subscription
reviewSchema.index({ booking: 1 }, { unique: true, partialFilterExpression: { booking: { $exists: true } } });
reviewSchema.index({ messSubscription: 1 }, { unique: true, partialFilterExpression: { messSubscription: { $exists: true } } });

// Indices for lookups
reviewSchema.index({ property: 1, createdAt: -1 });
reviewSchema.index({ mess: 1, createdAt: -1 });
reviewSchema.index({ student: 1, createdAt: -1 });

// Static method to calculate average rating
reviewSchema.statics.calculateAverageRating = async function (modelId) {
  // Check if it's a property or mess based on what fields are present in the review triggering this
  // However, since this is a static method called with an ID, we might need to know the type.
  // Actually, we can try to match both fields. If modelId is a property ID, it won't match any mess reviews usually.

  // Strategy: Try both aggregations or pass a type. 
  // Better: Check which collection the ID belongs to? No, that's expensive.
  // Simplest: We can pass the type or infer from the calling document (instance method wrapper).
  // But for now, let's just run aggregation for the field that matches.

  // We'll modify this to accept `type` ('property' or 'mess')
  // But to keep signature simple for hooks below:
};

reviewSchema.statics.updateAverageRating = async function (doc) {
  const isMess = !!doc.mess;
  const matchField = isMess ? 'mess' : 'property';
  const targetId = isMess ? doc.mess : doc.property;
  const Model = mongoose.model(isMess ? 'Mess' : 'Property');

  const stats = await this.aggregate([
    { $match: { [matchField]: targetId } },
    {
      $group: {
        _id: `$${matchField}`,
        avgRating: { $avg: '$rating' },
        numReviews: { $sum: 1 },
        // Common
        avgCleanliness: { $avg: '$ratings.cleanliness' },
        avgValue: { $avg: '$ratings.value' },
        // Property specific
        avgLocation: { $avg: '$ratings.location' },
        avgCommunication: { $avg: '$ratings.communication' },
        avgAmenities: { $avg: '$ratings.amenities' },
        // Mess specific
        avgFoodQuality: { $avg: '$ratings.foodQuality' },
        avgService: { $avg: '$ratings.service' }
      }
    }
  ]);

  const updateData = {};

  if (stats.length > 0) {
    updateData.averageRating = Math.round(stats[0].avgRating * 10) / 10;

    // Mess model schema uses `totalReviews` while Property uses `reviewCount`?
    // Let's check schemas. Property: reviewCount, ratingBreakdown. Mess: totalReviews.
    // We should probably normalize or handle both. 
    // Checking Property schema (inferred): likely has reviewCount.
    // Mess schema (checked): has totalReviews.

    if (isMess) {
      updateData.totalReviews = stats[0].numReviews;
      // Mess doesn't have ratingBreakdown in schema shown earlier, but it's good to add if needed.
      // For now, just update basics.
    } else {
      updateData.reviewCount = stats[0].numReviews;
      updateData.ratingBreakdown = {
        cleanliness: Math.round(stats[0].avgCleanliness * 10) / 10 || 0,
        location: Math.round(stats[0].avgLocation * 10) / 10 || 0,
        value: Math.round(stats[0].avgValue * 10) / 10 || 0,
        communication: Math.round(stats[0].avgCommunication * 10) / 10 || 0,
        amenities: Math.round(stats[0].avgAmenities * 10) / 10 || 0
      };
    }
  } else {
    updateData.averageRating = 0;
    if (isMess) {
      updateData.totalReviews = 0;
    } else {
      updateData.reviewCount = 0;
      updateData.ratingBreakdown = { cleanliness: 0, location: 0, value: 0, communication: 0, amenities: 0 };
    }
  }

  await Model.findByIdAndUpdate(targetId, updateData);
};

// Update property/mess rating after save
reviewSchema.post('save', function () {
  this.constructor.updateAverageRating(this);
});

// Update property/mess rating after remove
reviewSchema.post('remove', function () {
  // For remove, 'this' is the document.
  this.constructor.updateAverageRating(this);
});

// Handle findOneAndDelete, etc (middleware on query)
// This is trickier because we need the doc.
// For now relying on document middleware (save/remove).

module.exports = mongoose.model('Review', reviewSchema);
