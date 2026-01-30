const express = require('express');
const router = express.Router();
const Mess = require('../models/Mess');
const MessSubscription = require('../models/MessSubscription');
const MessSubscriptionAudit = require('../models/MessSubscriptionAudit');
const { protect, authorize } = require('../middleware/authMiddleware');

// ==================== ADMIN MESS ROUTES ====================

// GET /api/admin/mess - Get all mess services with pagination
router.get('/mess', protect, authorize('admin'), async (req, res) => {
    try {
        const {
            search,
            isActive,
            isVerified,
            page = 1,
            limit = 20
        } = req.query;

        const filter = {};

        // Search filter
        if (search) {
            filter.$or = [
                { name: new RegExp(search, 'i') },
                { location: new RegExp(search, 'i') }
            ];
        }

        // Active filter
        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }

        // Verified filter
        if (isVerified !== undefined) {
            filter.isVerified = isVerified === 'true';
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [messServices, total] = await Promise.all([
            Mess.find(filter)
                .populate('owner', 'name email phone')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Mess.countDocuments(filter)
        ]);

        res.json({
            messServices,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching all mess services:', error);
        res.status(500).json({ error: 'Failed to fetch mess services' });
    }
});

// PATCH /api/admin/mess/:id/verify-hygiene - Verify hygiene rating
router.patch('/mess/:id/verify-hygiene', protect, authorize('admin'), async (req, res) => {
    try {
        const { hygieneRating } = req.body;

        const mess = await Mess.findById(req.params.id);

        if (!mess) {
            return res.status(404).json({ error: 'Mess service not found' });
        }

        // Update hygiene verification
        mess.isVerified = true;
        if (hygieneRating !== undefined) {
            mess.averageRating = Math.min(5, Math.max(0, parseFloat(hygieneRating)));
        }
        await mess.save();

        res.json({
            message: 'Hygiene rating verified successfully',
            mess
        });
    } catch (error) {
        console.error('Error verifying hygiene rating:', error);
        res.status(500).json({ error: 'Failed to verify hygiene rating' });
    }
});

// PATCH /api/admin/mess/:id/toggle-active - Enable/disable mess service
router.patch('/mess/:id/toggle-active', protect, authorize('admin'), async (req, res) => {
    try {
        const mess = await Mess.findById(req.params.id);

        if (!mess) {
            return res.status(404).json({ error: 'Mess service not found' });
        }

        mess.isActive = !mess.isActive;
        await mess.save();

        res.json({
            message: `Mess service ${mess.isActive ? 'enabled' : 'disabled'} successfully`,
            mess
        });
    } catch (error) {
        console.error('Error toggling mess active status:', error);
        res.status(500).json({ error: 'Failed to toggle mess status' });
    }
});

// GET /api/admin/mess/subscriptions - View all subscriptions (read-only)
router.get('/mess/subscriptions', protect, authorize('admin'), async (req, res) => {
    try {
        const {
            status,
            messId,
            page = 1,
            limit = 20
        } = req.query;

        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (messId) {
            filter.mess = messId;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [subscriptions, total] = await Promise.all([
            MessSubscription.find(filter)
                .populate('user', 'name email phone')
                .populate('mess', 'name location owner')
                .populate('approvedBy', 'name')
                .populate('rejectedBy', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            MessSubscription.countDocuments(filter)
        ]);

        res.json({
            subscriptions,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching all subscriptions:', error);
        res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
});

// GET /api/admin/mess/audits - View approval/rejection audit logs
router.get('/mess/audits', protect, authorize('admin'), async (req, res) => {
    try {
        const {
            action,
            messId,
            page = 1,
            limit = 20
        } = req.query;

        const filter = {};

        if (action) {
            filter.action = action.toUpperCase();
        }

        if (messId) {
            filter.mess = messId;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [audits, total] = await Promise.all([
            MessSubscriptionAudit.find(filter)
                .populate('subscription')
                .populate('mess', 'name location')
                .populate('student', 'name email')
                .populate('performedBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            MessSubscriptionAudit.countDocuments(filter)
        ]);

        res.json({
            audits,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

// GET /api/admin/mess/stats - Get mess statistics
router.get('/mess/stats', protect, authorize('admin'), async (req, res) => {
    try {
        const [
            totalMess,
            activeMess,
            verifiedMess,
            totalSubscriptions,
            activeSubscriptions,
            pendingSubscriptions
        ] = await Promise.all([
            Mess.countDocuments(),
            Mess.countDocuments({ isActive: true }),
            Mess.countDocuments({ isVerified: true }),
            MessSubscription.countDocuments(),
            MessSubscription.countDocuments({ status: 'Active' }),
            MessSubscription.countDocuments({ status: 'Pending' })
        ]);

        res.json({
            mess: {
                total: totalMess,
                active: activeMess,
                verified: verifiedMess,
                inactive: totalMess - activeMess
            },
            subscriptions: {
                total: totalSubscriptions,
                active: activeSubscriptions,
                pending: pendingSubscriptions
            }
        });
    } catch (error) {
        console.error('Error fetching mess stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

module.exports = router;
