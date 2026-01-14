const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const Property = require('../models/Property');
const { authenticate } = require('../middleware/authMiddleware');

// Get user's wishlist
router.get('/', authenticate, async (req, res) => {
  try {
    const wishlistItems = await Wishlist.find({ user: req.user.id })
      .populate({
        path: 'property',
        populate: {
          path: 'owner',
          select: 'name email'
        }
      })
      .sort({ addedAt: -1 });

    // Filter out items where property might have been deleted
    const validItems = wishlistItems.filter(item => item.property !== null);

    res.json({
      success: true,
      count: validItems.length,
      wishlist: validItems
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch wishlist' 
    });
  }
});

// Get wishlist property IDs only (for quick check)
router.get('/ids', authenticate, async (req, res) => {
  try {
    const wishlistItems = await Wishlist.find({ user: req.user.id })
      .select('property')
      .lean();

    const propertyIds = wishlistItems.map(item => item.property.toString());

    res.json({
      success: true,
      propertyIds
    });
  } catch (error) {
    console.error('Error fetching wishlist IDs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch wishlist' 
    });
  }
});

// Check if property is in wishlist
router.get('/check/:propertyId', authenticate, async (req, res) => {
  try {
    const exists = await Wishlist.findOne({ 
      user: req.user.id, 
      property: req.params.propertyId 
    });

    res.json({
      success: true,
      isInWishlist: !!exists
    });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check wishlist' 
    });
  }
});

// Add property to wishlist
router.post('/:propertyId', authenticate, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { notes } = req.body;

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ 
        success: false, 
        message: 'Property not found' 
      });
    }

    // Check if already in wishlist
    const existing = await Wishlist.findOne({ 
      user: req.user.id, 
      property: propertyId 
    });

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Property already in wishlist' 
      });
    }

    // Add to wishlist
    const wishlistItem = new Wishlist({
      user: req.user.id,
      property: propertyId,
      notes: notes || ''
    });

    await wishlistItem.save();

    // Populate property details for response
    await wishlistItem.populate({
      path: 'property',
      populate: {
        path: 'owner',
        select: 'name email'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Property added to wishlist',
      wishlistItem
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Property already in wishlist' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add to wishlist' 
    });
  }
});

// Remove property from wishlist
router.delete('/:propertyId', authenticate, async (req, res) => {
  try {
    const { propertyId } = req.params;

    const result = await Wishlist.findOneAndDelete({ 
      user: req.user.id, 
      property: propertyId 
    });

    if (!result) {
      return res.status(404).json({ 
        success: false, 
        message: 'Property not found in wishlist' 
      });
    }

    res.json({
      success: true,
      message: 'Property removed from wishlist'
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to remove from wishlist' 
    });
  }
});

// Toggle wishlist (add if not exists, remove if exists)
router.post('/toggle/:propertyId', authenticate, async (req, res) => {
  try {
    const { propertyId } = req.params;

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ 
        success: false, 
        message: 'Property not found' 
      });
    }

    // Check if already in wishlist
    const existing = await Wishlist.findOne({ 
      user: req.user.id, 
      property: propertyId 
    });

    if (existing) {
      // Remove from wishlist
      await Wishlist.findByIdAndDelete(existing._id);
      return res.json({
        success: true,
        action: 'removed',
        message: 'Property removed from wishlist',
        isInWishlist: false
      });
    } else {
      // Add to wishlist
      const wishlistItem = new Wishlist({
        user: req.user.id,
        property: propertyId
      });
      await wishlistItem.save();

      return res.json({
        success: true,
        action: 'added',
        message: 'Property added to wishlist',
        isInWishlist: true
      });
    }
  } catch (error) {
    console.error('Error toggling wishlist:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update wishlist' 
    });
  }
});

// Update wishlist item notes
router.patch('/:propertyId/notes', authenticate, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { notes } = req.body;

    const wishlistItem = await Wishlist.findOneAndUpdate(
      { user: req.user.id, property: propertyId },
      { notes: notes || '' },
      { new: true }
    ).populate('property');

    if (!wishlistItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Property not found in wishlist' 
      });
    }

    res.json({
      success: true,
      message: 'Notes updated',
      wishlistItem
    });
  } catch (error) {
    console.error('Error updating notes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update notes' 
    });
  }
});

module.exports = router;
