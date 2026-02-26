const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const messAdminController = require('../controllers/messAdminController');

// ==================== ADMIN MESS ROUTES ====================

router.get('/mess', protect, authorize('admin'), messAdminController.adminGetAllMessServices);
router.patch('/mess/:id/verify-hygiene', protect, authorize('admin'), messAdminController.adminVerifyHygiene);
router.patch('/mess/:id/toggle-active', protect, authorize('admin'), messAdminController.adminToggleActive);
router.get('/mess/subscriptions', protect, authorize('admin'), messAdminController.adminGetSubscriptions);
router.get('/mess/audits', protect, authorize('admin'), messAdminController.adminGetAudits);
router.get('/mess/stats', protect, authorize('admin'), messAdminController.adminGetStats);

module.exports = router;
