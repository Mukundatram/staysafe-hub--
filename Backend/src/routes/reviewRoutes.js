const express = require('express');
const mongoose = require('mongoose');
const { authenticate, authorize, protect } = require('../middleware/authMiddleware');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Property = require('../models/Property');

const router = express.Router();

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

/* ===================== CREATE A REVIEW ===================== */
router.post(
  '/',
  authenticate,
  authorize(['student']),
  async (req, res) => {
    try {
      const { bookingId, rating, title, comment, ratings } = req.body;

      // Validate booking ID
      if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({ message: 'Invalid booking ID' });
      }

      // Check if booking exists and belongs to the student
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

      // Check if review already exists for this booking
      const existingReview = await Review.findOne({ booking: bookingId });
      if (existingReview) {
        return res.status(400).json({ 
          message: 'You have already reviewed this stay' 
        });
      }

      // Create the review
      const review = await Review.create({
        student: req.user._id,
        property: booking.property._id,
        booking: bookingId,
        rating,
        title,
        comment,
        ratings: ratings || {}
      });

      // Populate student info for response
      await review.populate('student', 'name');

      res.status(201).json({
        message: 'Review submitted successfully',
        review
      });
    } catch (error) {
      console.error('Error creating review:', error);
      if (error.code === 11000) {
        return res.status(400).json({ message: 'You have already reviewed this stay' });
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

      // Find review and verify owner owns the property
      const review = await Review.findById(reviewId).populate('property', 'owner');
      
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }

      if (review.property.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only respond to reviews on your properties' });
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
      await review.deleteOne();

      // Recalculate property rating
      await Review.calculateAverageRating(propertyId);

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
