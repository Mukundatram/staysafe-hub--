const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const bookingController = require('../controllers/bookingController');
const { validate, bookingRules } = require('../middleware/validate');

// ==================== ADMIN ROUTES ====================
router.get('/', authenticate, authorize(['admin']), bookingController.getAllBookings);
router.patch('/admin/:booking_id', authenticate, authorize(['admin']), bookingController.adminUpdateBooking);
router.post('/admin/create-booking', authenticate, authorize(['admin']), bookingController.adminCreateBooking);

// ==================== OWNER ROUTES ====================
router.get('/owner', authenticate, authorize(['owner']), bookingController.ownerGetBookings);
router.patch('/owner/:booking_id', authenticate, authorize(['owner']), bookingController.ownerUpdateBooking);

// ==================== STUDENT ROUTES ====================
router.post('/book/:property_id', authenticate, authorize(['student']), validate(bookingRules), bookingController.createBooking);
router.get('/my', authenticate, authorize(['student']), bookingController.studentGetBookings);
router.patch('/leave/:booking_id', authenticate, authorize(['student']), bookingController.studentLeaveRoom);
router.patch('/cancel/:booking_id', authenticate, authorize(['student']), bookingController.studentCancelBooking);

module.exports = router;
