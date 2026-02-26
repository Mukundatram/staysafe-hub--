const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { handleMessImageUpload } = require('../middleware/uploadMiddleware');
const messController = require('../controllers/messController');

// ==================== PUBLIC ROUTES ====================
router.get('/', messController.getAllMessServices);
router.get('/subscriptions/my', protect, messController.getMySubscriptions);

// ==================== OWNER ROUTES ====================
router.get('/owner/my-services', protect, authorize('owner'), messController.ownerGetMyServices);
router.get('/owner/subscriptions', protect, authorize('owner'), messController.ownerGetSubscriptions);

// ==================== SINGLE MESS ====================
router.get('/:id', messController.getMessDetails);
router.post('/', protect, authorize('owner', 'admin'), handleMessImageUpload, messController.createMessService);
router.put('/:id', protect, authorize('owner', 'admin'), messController.updateMessService);
router.delete('/:id', protect, authorize('owner', 'admin'), messController.deleteMessService);
router.post('/:id/subscribe', protect, messController.subscribeToMess);
router.get('/:id/subscribers', protect, authorize('owner', 'admin'), messController.getMessSubscribers);

// ==================== SUBSCRIPTIONS ====================
router.patch('/subscriptions/:id/cancel', protect, messController.cancelSubscription);
router.patch('/subscriptions/:id/approve', protect, authorize('owner', 'admin'), messController.approveSubscription);
router.patch('/subscriptions/:id/reject', protect, authorize('owner', 'admin'), messController.rejectSubscription);

module.exports = router;
