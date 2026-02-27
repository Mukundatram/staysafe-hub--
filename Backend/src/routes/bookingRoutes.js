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

// ==================== ROOMMATE JOINT BOOKING ROUTES ====================
router.post('/book-with-roommate/:property_id', authenticate, authorize(['student']), bookingController.bookWithRoommate);
router.patch('/confirm-roommate/:booking_id', authenticate, authorize(['student']), bookingController.confirmRoommate);
router.get('/pending-roommate-invites', authenticate, authorize(['student']), bookingController.getPendingRoommateInvites);

// ==================== ROOM SHARE DISCOVERY ROUTES ====================
router.get('/room-shares', authenticate, authorize(['student']), bookingController.getRoomShares);
router.post('/request-join/:booking_id', authenticate, authorize(['student']), bookingController.requestJoin);
router.patch('/respond-join/:booking_id/:request_id', authenticate, authorize(['student']), bookingController.respondJoin);
router.get('/pending-join-requests', authenticate, authorize(['student']), bookingController.getPendingJoinRequests);

module.exports = router;
