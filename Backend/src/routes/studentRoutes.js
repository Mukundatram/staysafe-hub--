const express = require('express');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const Property = require('../models/Property');
const Booking = require('../models/Booking');
const router = express.Router();
const cache = require('memory-cache');

// Cache middleware
const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    const key = '__express__' + req.originalUrl || req.url;
    const cachedBody = cache.get(key);
    if (cachedBody) {
      res.send(cachedBody);
      return;
    } else {
      res.sendResponse = res.send;
      res.send = (body) => {
        cache.put(key, body, duration * 1000);
        res.sendResponse(body);
      };
      next();
    }
  };
};

// 1️⃣ Student Dashboard
router.get('/dashboard', authenticate, authorize(['student']), async (req, res) => {
  try {
    const bookings = await Booking.find({ student: req.user._id })
      .populate({
        path: 'property',
        select: 'title rent location amenities meals images owner',
        populate: {
          path: 'owner',
          select: 'name email'
        }
      });
    
    res.json({
      student: req.user.name,
      email: req.user.email,
      bookings
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 2️⃣ View all available properties with caching (e.g., for 10 minutes)
router.get('/properties', authenticate, authorize(['student']), cacheMiddleware(600), async (req, res) => {
  try {
    const properties = await Property.find({ isAvailable: true });
    res.json(properties);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;