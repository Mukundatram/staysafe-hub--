const express = require('express');
const router = express.Router();
const Mess = require('../models/Mess');
const MessSubscription = require('../models/MessSubscription');
const { protect, authorize } = require('../middleware/authMiddleware');
const { handleMessImageUpload } = require('../middleware/uploadMiddleware');

// ==================== PUBLIC ROUTES ====================

// GET /api/mess - Get all mess services with filters
router.get('/', async (req, res) => {
  try {
    const {
      search,
      location,
      cuisineType,
      mealType,
      minPrice,
      maxPrice,
      features,
      minRating,
      sortBy,
      page = 1,
      limit = 12
    } = req.query;

    // Build filter query
    const filter = { isActive: true };

    // Search filter
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { location: new RegExp(search, 'i') }
      ];
    }

    // Location filter
    if (location) {
      filter.location = new RegExp(location, 'i');
    }

    // Cuisine type filter
    if (cuisineType) {
      const cuisines = cuisineType.split(',');
      filter.cuisineType = { $in: cuisines };
    }

    // Meal type filter
    if (mealType) {
      const meals = mealType.split(',');
      filter.mealTypes = { $in: meals };
    }

    // Price range filter (monthly all meals)
    if (minPrice || maxPrice) {
      filter['pricing.monthly.allMeals'] = {};
      if (minPrice) filter['pricing.monthly.allMeals'].$gte = parseInt(minPrice);
      if (maxPrice) filter['pricing.monthly.allMeals'].$lte = parseInt(maxPrice);
    }

    // Features filter
    if (features) {
      const featureList = features.split(',');
      filter.features = { $all: featureList };
    }

    // Rating filter
    if (minRating) {
      filter.averageRating = { $gte: parseFloat(minRating) };
    }

    // Sorting
    let sort = { createdAt: -1 };
    if (sortBy) {
      switch (sortBy) {
        case 'price_asc':
          sort = { 'pricing.monthly.allMeals': 1 };
          break;
        case 'price_desc':
          sort = { 'pricing.monthly.allMeals': -1 };
          break;
        case 'rating':
          sort = { averageRating: -1 };
          break;
        case 'popular':
          sort = { subscribersCount: -1 };
          break;
        case 'newest':
          sort = { createdAt: -1 };
          break;
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [messServices, total] = await Promise.all([
      Mess.find(filter)
        .populate('owner', 'name email phone')
        .sort(sort)
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
    console.error('Error fetching mess services:', error);
    res.status(500).json({ error: 'Failed to fetch mess services' });
  }
});

// GET /api/mess/:id - Get single mess service details
router.get('/:id', async (req, res) => {
  try {
    const mess = await Mess.findById(req.params.id)
      .populate('owner', 'name email phone');

    if (!mess) {
      return res.status(404).json({ error: 'Mess service not found' });
    }

    res.json(mess);
  } catch (error) {
    console.error('Error fetching mess details:', error);
    res.status(500).json({ error: 'Failed to fetch mess details' });
  }
});

// ==================== PROTECTED ROUTES ====================

// POST /api/mess - Create new mess service (Owner only)
router.post('/', protect, authorize('owner', 'admin'), handleMessImageUpload, async (req, res) => {
  try {
    const {
      name,
      description,
      location,
      coordinates,
      address,
      contactPhone,
      contactEmail,
      mealTypes,
      cuisineType,
      menu,
      pricing,
      timings,
      features,
      maxSubscribers
    } = req.body;

    // Process uploaded images
    const images = req.files ? req.files.map(file => `/uploads/properties/${file.filename}`) : [];

    const mess = new Mess({
      name,
      description,
      location,
      coordinates: coordinates ? JSON.parse(coordinates) : undefined,
      address,
      contactPhone,
      contactEmail,
      mealTypes: mealTypes ? JSON.parse(mealTypes) : [],
      cuisineType: cuisineType ? JSON.parse(cuisineType) : [],
      menu: menu ? JSON.parse(menu) : {},
      pricing: pricing ? JSON.parse(pricing) : {},
      timings: timings ? JSON.parse(timings) : {},
      features: features ? JSON.parse(features) : [],
      images,
      maxSubscribers: maxSubscribers || 100,
      owner: req.user._id
    });

    await mess.save();

    res.status(201).json({
      message: 'Mess service created successfully',
      mess
    });
  } catch (error) {
    console.error('Error creating mess service:', error);
    res.status(500).json({ error: 'Failed to create mess service' });
  }
});

// PUT /api/mess/:id - Update mess service (Owner only)
router.put('/:id', protect, authorize('owner', 'admin'), async (req, res) => {
  try {
    const mess = await Mess.findById(req.params.id);

    if (!mess) {
      return res.status(404).json({ error: 'Mess service not found' });
    }

    // Check ownership
    if (mess.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this mess service' });
    }

    const updates = req.body;
    
    // Parse JSON strings if needed
    if (typeof updates.mealTypes === 'string') updates.mealTypes = JSON.parse(updates.mealTypes);
    if (typeof updates.cuisineType === 'string') updates.cuisineType = JSON.parse(updates.cuisineType);
    if (typeof updates.menu === 'string') updates.menu = JSON.parse(updates.menu);
    if (typeof updates.pricing === 'string') updates.pricing = JSON.parse(updates.pricing);
    if (typeof updates.timings === 'string') updates.timings = JSON.parse(updates.timings);
    if (typeof updates.features === 'string') updates.features = JSON.parse(updates.features);

    Object.assign(mess, updates);
    await mess.save();

    res.json({
      message: 'Mess service updated successfully',
      mess
    });
  } catch (error) {
    console.error('Error updating mess service:', error);
    res.status(500).json({ error: 'Failed to update mess service' });
  }
});

// DELETE /api/mess/:id - Delete mess service (Owner only)
router.delete('/:id', protect, authorize('owner', 'admin'), async (req, res) => {
  try {
    const mess = await Mess.findById(req.params.id);

    if (!mess) {
      return res.status(404).json({ error: 'Mess service not found' });
    }

    // Check ownership
    if (mess.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this mess service' });
    }

    await mess.deleteOne();

    res.json({ message: 'Mess service deleted successfully' });
  } catch (error) {
    console.error('Error deleting mess service:', error);
    res.status(500).json({ error: 'Failed to delete mess service' });
  }
});

// GET /api/mess/owner/my-services - Get owner's mess services
router.get('/owner/my-services', protect, authorize('owner'), async (req, res) => {
  try {
    const messServices = await Mess.find({ owner: req.user._id })
      .sort({ createdAt: -1 });

    res.json(messServices);
  } catch (error) {
    console.error('Error fetching owner mess services:', error);
    res.status(500).json({ error: 'Failed to fetch mess services' });
  }
});

// ==================== SUBSCRIPTION ROUTES ====================

// POST /api/mess/:id/subscribe - Subscribe to mess service
router.post('/:id/subscribe', protect, async (req, res) => {
  try {
    const { plan, selectedMeals, startDate, deliveryPreference, deliveryAddress, specialInstructions } = req.body;

    const mess = await Mess.findById(req.params.id);

    if (!mess) {
      return res.status(404).json({ error: 'Mess service not found' });
    }

    // Check if already subscribed
    const existingSubscription = await MessSubscription.findOne({
      user: req.user._id,
      mess: req.params.id,
      status: 'Active'
    });

    if (existingSubscription) {
      return res.status(400).json({ error: 'You already have an active subscription to this mess' });
    }

    // Calculate amount based on plan
    let amount = 0;
    const pricing = mess.pricing;
    
    switch (plan) {
      case 'monthly-all':
        amount = pricing.monthly?.allMeals || 0;
        break;
      case 'monthly-two':
        amount = pricing.monthly?.twoMeals || 0;
        break;
      case 'monthly-one':
        amount = pricing.monthly?.oneMeal || 0;
        break;
      case 'monthly-breakfast':
        amount = pricing.monthly?.breakfast || 0;
        break;
      case 'monthly-lunch':
        amount = pricing.monthly?.lunch || 0;
        break;
      case 'monthly-dinner':
        amount = pricing.monthly?.dinner || 0;
        break;
      default:
        amount = pricing.monthly?.allMeals || 0;
    }

    // Calculate end date (1 month from start)
    const start = new Date(startDate || Date.now());
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    // Atomically reserve a slot by incrementing counters only if under maxSubscribers
    const maxSubs = mess.maxSubscribers || 100;
    const reserved = await Mess.findOneAndUpdate(
      { _id: mess._id, currentSubscribers: { $lt: maxSubs } },
      { $inc: { currentSubscribers: 1, subscribersCount: 1 } },
      { new: true }
    );

    if (!reserved) {
      return res.status(400).json({ error: 'Mess service is full' });
    }

    // Create subscription now that a slot has been reserved; rollback counter if save fails
    const subscription = new MessSubscription({
      user: req.user._id,
      mess: req.params.id,
      plan,
      selectedMeals: selectedMeals || [],
      startDate: start,
      endDate: end,
      amount,
      deliveryPreference,
      deliveryAddress,
      specialInstructions,
      status: 'Pending',
      paymentStatus: 'Pending'
    });

    try {
      await subscription.save();
      // Emit socket event for new subscription
      try {
        const io = req.app.get('io');
        if (io) {
          const ownerId = mess && mess.owner ? (mess.owner._id ? mess.owner._id.toString() : mess.owner.toString()) : null;
          const userId = req.user._id.toString();
          if (ownerId) io.to(`user_${ownerId}`).emit('mess:subscription:created', { subscription, messId: mess._id, userId });
          io.to(`user_${userId}`).emit('mess:subscription:created', { subscription, messId: mess._id, ownerId });
        }
      } catch (emitErr) {
        console.error('Socket emit error (messSubscriptionCreated):', emitErr);
      }
      res.status(201).json({
        message: 'Subscription request sent successfully',
        subscription
      });
    } catch (saveErr) {
      // rollback counters
      try {
        await Mess.findByIdAndUpdate(mess._id, { $inc: { currentSubscribers: -1, subscribersCount: -1 } });
      } catch (rbErr) {
        console.error('Failed to rollback mess counters after subscription save failure:', rbErr);
      }
      throw saveErr;
    }
  } catch (error) {
    console.error('Error subscribing to mess:', error);
    res.status(500).json({ error: 'Failed to subscribe to mess service' });
  }
});

// GET /api/mess/subscriptions/my - Get user's subscriptions
router.get('/subscriptions/my', protect, async (req, res) => {
  try {
    const subscriptions = await MessSubscription.find({ user: req.user._id })
      .populate('mess', 'name location images pricing timings')
      .sort({ createdAt: -1 });

    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// PATCH /api/mess/subscriptions/:id/cancel - Cancel subscription
router.patch('/subscriptions/:id/cancel', protect, async (req, res) => {
  try {
    const subscription = await MessSubscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    subscription.status = 'Cancelled';
    await subscription.save();

    // Update subscriber count
    await Mess.findByIdAndUpdate(subscription.mess, {
      $inc: { currentSubscribers: -1 }
    });

    // Emit cancellation event
    try {
      const io = req.app.get('io');
      if (io) {
        const mess = await Mess.findById(subscription.mess);
        const ownerId = mess && mess.owner ? (mess.owner._id ? mess.owner._id.toString() : mess.owner.toString()) : null;
        const userId = subscription.user ? (subscription.user._id ? subscription.user._id.toString() : subscription.user.toString()) : null;
        if (ownerId) io.to(`user_${ownerId}`).emit('mess:subscription:cancelled', { subscription, messId: subscription.mess, userId });
        if (userId) io.to(`user_${userId}`).emit('mess:subscription:cancelled', { subscription, messId: subscription.mess, ownerId });
      }
    } catch (emitErr) {
      console.error('Socket emit error (messSubscriptionCancelled):', emitErr);
    }

    res.json({
      message: 'Subscription cancelled successfully',
      subscription
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// GET /api/mess/:id/subscribers - Get mess subscribers (Owner only)
router.get('/:id/subscribers', protect, authorize('owner', 'admin'), async (req, res) => {
  try {
    const mess = await Mess.findById(req.params.id);

    if (!mess) {
      return res.status(404).json({ error: 'Mess service not found' });
    }

    if (mess.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const subscribers = await MessSubscription.find({ 
      mess: req.params.id,
      status: { $in: ['Active', 'Pending'] }
    })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(subscribers);
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

// PATCH /api/mess/subscriptions/:id/approve - Approve subscription (Owner only)
router.patch('/subscriptions/:id/approve', protect, authorize('owner', 'admin'), async (req, res) => {
  try {
    const subscription = await MessSubscription.findById(req.params.id)
      .populate('mess');

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (subscription.mess.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    subscription.status = 'Active';
    await subscription.save();

    // Emit approval event
    try {
      const io = req.app.get('io');
      if (io) {
        const ownerId = subscription.mess && subscription.mess.owner ? (subscription.mess.owner._id ? subscription.mess.owner._id.toString() : subscription.mess.owner.toString()) : null;
        const userId = subscription.user ? (subscription.user._id ? subscription.user._id.toString() : subscription.user.toString()) : null;
        if (ownerId) io.to(`user_${ownerId}`).emit('mess:subscription:approved', { subscription, messId: subscription.mess, userId });
        if (userId) io.to(`user_${userId}`).emit('mess:subscription:approved', { subscription, messId: subscription.mess, ownerId });
      }
    } catch (emitErr) {
      console.error('Socket emit error (messSubscriptionApproved):', emitErr);
    }

    res.json({
      message: 'Subscription approved successfully',
      subscription
    });
  } catch (error) {
    console.error('Error approving subscription:', error);
    res.status(500).json({ error: 'Failed to approve subscription' });
  }
});

module.exports = router;
