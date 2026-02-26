const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const reviewController = require('../controllers/reviewController');
const { validate, reviewRules } = require('../middleware/validate');

// ==================== PUBLIC ROUTES ====================
router.get('/property/:propertyId', reviewController.getPropertyReviews);
router.get('/mess/:messId', reviewController.getMessReviews);

// ==================== STUDENT ROUTES ====================
router.get('/check-mess-eligibility/:subscriptionId', authenticate, authorize(['student']), reviewController.checkMessEligibility);
router.get('/can-review/:bookingId', authenticate, authorize(['student']), reviewController.canReviewBooking);
router.post('/', authenticate, authorize(['student']), validate(reviewRules), reviewController.createReview);
router.get('/my-reviews', authenticate, reviewController.getMyReviews);

// ==================== OWNER ROUTES ====================
router.patch('/:reviewId/respond', authenticate, authorize(['owner']), reviewController.respondToReview);

// ==================== SHARED ROUTES ====================
router.delete('/:reviewId', authenticate, reviewController.deleteReview);
router.patch('/:reviewId/helpful', authenticate, reviewController.markHelpful);

module.exports = router;
