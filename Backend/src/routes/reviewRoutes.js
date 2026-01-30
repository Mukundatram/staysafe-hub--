const express = require('express');
const mongoose = require('mongoose');
const { authenticate, authorize, protect } = require('../middleware/authMiddleware');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Property = require('../models/Property');
const Mess = require('../models/Mess');
const MessSubscription = require('../models/MessSubscription');

const router = express.Router();

/* ===================== CHECK IF USER CAN REVIEW A MESS ===================== */
router.get(
  '/check-mess-eligibility/:subscriptionId',
  authenticate,
  authorize(['student']),
  async (req, res) => {
    try {
      const { subscriptionId } = req.params;
      console.log('CHECKING MESS REVIEW ELIGIBILITY:', subscriptionId, 'User:', req.user._id);

      if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
        console.log('Invalid subscription ID provided');
        return res.status(400).json({ canReview: false, message: 'Invalid subscription ID' });
      }

      const subscription = await MessSubscription.findOne({
        _id: subscriptionId,
        user: req.user._id,
        status: { $in: ['Active', 'Expired'] }
      });
      console.log('Subscription found:', !!subscription);

      if (!subscription) {
        return res.json({ canReview: false, message: 'Subscription not eligible for review' });
      }

      const existingReview = await Review.findOne({ messSubscription: subscriptionId });
      if (existingReview) {
        return res.json({ canReview: false, message: 'Already reviewed', review: existingReview });
      }

      res.json({ canReview: true });
    } catch (error) {
      console.error('Error checking mess review eligibility:', error);
      res.status(500).json({ canReview: false, message: 'Server error' });
    }
  }
);

/* ===================== GET REVIEWS FOR A PROPERTY ===================== */
router.get('/property/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || 'newest'; // newest, oldest, highest, lowest

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'oldest':
        sortObj = { createdAt: 1 };
        break;
      case 'highest':
        sortObj = { rating: -1, createdAt: -1 };
        break;
      case 'lowest':
        sortObj = { rating: 1, createdAt: -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    const reviews = await Review.find({ property: propertyId })
      .populate('student', 'name')
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ property: propertyId });

    // Get rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { property: new mongoose.Types.ObjectId(propertyId) } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    // Convert to object format
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingDistribution.forEach(item => {
      distribution[item._id] = item.count;
    });

    res.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      ratingDistribution: distribution
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ===================== GET REVIEWS FOR A MESS ===================== */
router.get('/mess/:messId', async (req, res) => {
  try {
    const { messId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || 'newest';

    if (!mongoose.Types.ObjectId.isValid(messId)) {
      return res.status(400).json({ message: 'Invalid mess ID' });
    }

    let sortObj = {};
    switch (sort) {
      case 'oldest': sortObj = { createdAt: 1 }; break;
      case 'highest': sortObj = { rating: -1, createdAt: -1 }; break;
      case 'lowest': sortObj = { rating: 1, createdAt: -1 }; break;
      default: sortObj = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    const reviews = await Review.find({ mess: messId })
      .populate('student', 'name')
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ mess: messId });

    const ratingDistribution = await Review.aggregate([
      { $match: { mess: new mongoose.Types.ObjectId(messId) } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingDistribution.forEach(item => {
      distribution[item._id] = item.count;
    });

    res.json({
      reviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      ratingDistribution: distribution
    });
  } catch (error) {
    console.error('Error fetching mess reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ===================== CREATE A REVIEW ===================== */
router.post(
  '/',
  authenticate,
  authorize(['student']),
  async (req, res) => {
    try {
      const { bookingId, messSubscriptionId, rating, title, comment, ratings } = req.body;

      // Handle Property Review
      if (bookingId) {
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
          return res.status(400).json({ message: 'Invalid booking ID' });
        }

        const booking = await Booking.findOne({
          _id: bookingId,
          student: req.user._id,
          status: 'Completed'
        }).populate('property', 'title');

        if (!booking) {
          return res.status(404).json({
            message: 'Completed booking not found or you do not have permission'
          });
        }

        const existingReview = await Review.findOne({ booking: bookingId });
        if (existingReview) {
          return res.status(400).json({
            message: 'You have already reviewed this stay'
          });
        }

        const review = await Review.create({
          student: req.user._id,
          property: booking.property._id,
          booking: bookingId,
          rating,
          title,
          comment,
          ratings: ratings || {}
        });

        await review.populate('student', 'name');

        return res.status(201).json({
          message: 'Review submitted successfully',
          review
        });
      }

      // Handle Mess Review
      if (messSubscriptionId) {
        if (!mongoose.Types.ObjectId.isValid(messSubscriptionId)) {
          return res.status(400).json({ message: 'Invalid subscription ID' });
        }

        const subscription = await MessSubscription.findOne({
          _id: messSubscriptionId,
          user: req.user._id,
          status: { $in: ['Active', 'Expired'] } // Allow reviewing Active or Expired (finished) subs
        }).populate('mess', 'name');

        if (!subscription) {
          return res.status(404).json({
            message: 'Active or Expired subscription not found or you do not have permission'
          });
        }

        const existingReview = await Review.findOne({ messSubscription: messSubscriptionId });
        if (existingReview) {
          return res.status(400).json({
            message: 'You have already reviewed this subscription'
          });
        }

        const review = await Review.create({
          student: req.user._id,
          mess: subscription.mess._id,
          messSubscription: messSubscriptionId,
          rating,
          title,
          comment,
          ratings: ratings || {}
        });

        await review.populate('student', 'name');

        return res.status(201).json({
          message: 'Review submitted successfully',
          review
        });
      }

      return res.status(400).json({ message: 'Either bookingId or messSubscriptionId is required' });

    } catch (error) {
      console.error('Error creating review:', error);
      if (error.code === 11000) {
        return res.status(400).json({ message: 'You have already submitted a review' });
      }
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/* ===================== CHECK IF USER CAN REVIEW A BOOKING ===================== */
router.get(
  '/can-review/:bookingId',
  authenticate,
  authorize(['student']),
  async (req, res) => {
    try {
      const { bookingId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({ canReview: false, message: 'Invalid booking ID' });
      }

      // Check if booking is completed and belongs to user
      const booking = await Booking.findOne({
        _id: bookingId,
        student: req.user._id,
        status: 'Completed'
      });

      if (!booking) {
        return res.json({ canReview: false, message: 'Booking not eligible for review' });
      }

      // Check if review already exists
      const existingReview = await Review.findOne({ booking: bookingId });
      if (existingReview) {
        return res.json({ canReview: false, message: 'Already reviewed', review: existingReview });
      }

      res.json({ canReview: true });
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      res.status(500).json({ canReview: false, message: 'Server error' });
    }
  }
);



/* ===================== GET USER'S REVIEWS ===================== */
router.get(
  '/my-reviews',
  authenticate,
  async (req, res) => {
    try {
      const reviews = await Review.find({ student: req.user._id })
        .populate('property', 'title images location')
        .populate('mess', 'name images location')
        .sort({ createdAt: -1 });

      res.json(reviews);
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/* ===================== OWNER: RESPOND TO A REVIEW ===================== */
router.patch(
  '/:reviewId/respond',
  authenticate,
  authorize(['owner']),
  async (req, res) => {
    try {
      const { reviewId } = req.params;
      const { comment } = req.body;

      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ message: 'Invalid review ID' });
      }

      // Find review and verify owner owns the property or mess
      const review = await Review.findById(reviewId)
        .populate('property', 'owner')
        .populate('mess', 'owner');

      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }

      let resourceOwnerId;
      if (review.property) {
        resourceOwnerId = review.property.owner;
      } else if (review.mess) {
        resourceOwnerId = review.mess.owner;
      }

      if (resourceOwnerId && resourceOwnerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only respond to reviews on your properties or mess services' });
      }

      review.ownerResponse = {
        comment,
        respondedAt: new Date()
      };
      await review.save();

      res.json({
        message: 'Response added successfully',
        review
      });
    } catch (error) {
      console.error('Error responding to review:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/* ===================== DELETE A REVIEW (Admin or Owner) ===================== */
router.delete(
  '/:reviewId',
  authenticate,
  async (req, res) => {
    try {
      const { reviewId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ message: 'Invalid review ID' });
      }

      const review = await Review.findById(reviewId);

      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }

      // Only allow the student who wrote it or admin to delete
      if (review.student.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to delete this review' });
      }

      const propertyId = review.property;
      const messId = review.mess;

      await review.deleteOne();

      // Recalculate rating
      if (propertyId) {
        await Review.updateAverageRating({ property: propertyId });
      } else if (messId) {
        // Need to pass a doc-like object or modify updateAverageRating to take id + type.
        // Current implementation expects a doc with .mess or .property
        await Review.updateAverageRating({ mess: messId });
      }

      res.json({ message: 'Review deleted successfully' });
    } catch (error) {
      console.error('Error deleting review:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/* ===================== MARK REVIEW AS HELPFUL ===================== */
router.patch(
  '/:reviewId/helpful',
  authenticate,
  async (req, res) => {
    try {
      const { reviewId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ message: 'Invalid review ID' });
      }

      const review = await Review.findByIdAndUpdate(
        reviewId,
        { $inc: { helpfulVotes: 1 } },
        { new: true }
      );

      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }

      res.json({ helpfulVotes: review.helpfulVotes });
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
