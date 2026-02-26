const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const roommateController = require('../controllers/roommateController');

// ===== PROFILE MANAGEMENT =====
router.post('/profile', protect, roommateController.createOrUpdateProfile);
router.get('/my-profile', protect, roommateController.getMyProfile);
router.patch('/profile/active', protect, roommateController.toggleProfileActive);
router.delete('/profile', protect, roommateController.deleteProfile);
router.get('/profile/:userId', protect, roommateController.getProfileByUserId);

// ===== MATCHING & DISCOVERY =====
router.get('/matches', protect, roommateController.getMatches);

// ===== CONNECTION REQUESTS =====
router.post('/request', protect, roommateController.sendRequest);
router.get('/requests/received', protect, roommateController.getReceivedRequests);
router.get('/requests/sent', protect, roommateController.getSentRequests);
router.patch('/request/:id/accept', protect, roommateController.acceptRequest);
router.patch('/request/:id/reject', protect, roommateController.rejectRequest);

// ===== CONNECTIONS =====
router.get('/connections', protect, roommateController.getConnections);
router.post('/block/:userId', protect, roommateController.blockUser);

// ===== PROPERTY SHARING =====
router.post('/share-property', protect, roommateController.shareProperty);
router.get('/shared-properties/:roommateId', protect, roommateController.getSharedProperties);

module.exports = router;
