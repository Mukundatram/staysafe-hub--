const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');

// ==================== ROOMMATE CHAT ROUTES ====================
// IMPORTANT: These must come BEFORE the generic /:propertyId/:userId routes
// to avoid "roommate" being interpreted as a propertyId
router.get('/roommate/conversations', protect, chatController.getRoommateConversations);
router.get('/roommate/:roommateId', protect, chatController.getRoommateMessages);
router.post('/roommate/send', protect, chatController.sendRoommateMessage);

// ==================== PROPERTY/MESS CHAT ROUTES ====================
router.get('/conversations', protect, chatController.getConversations);
router.get('/unread-count', protect, chatController.getUnreadCount);
router.post('/send', protect, chatController.sendPropertyMessage);
router.delete('/:propertyId/:userId', protect, chatController.deletePropertyConversation);

// ==================== MESS CHAT ROUTES ====================
router.get('/mess/conversations', protect, chatController.getMessConversations);
router.get('/mess/:messId/:userId', protect, chatController.getMessMessages);
router.post('/mess/send', protect, chatController.sendMessMessage);
router.delete('/mess/:messId/:userId', protect, chatController.deleteMessConversation);

// ==================== GENERIC PROPERTY MESSAGES (must be LAST) ====================
router.get('/:propertyId/:userId', protect, chatController.getPropertyMessages);

module.exports = router;
