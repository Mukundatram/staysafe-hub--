const express = require('express');
const path = require('path');
const fs = require('fs');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { handlePropertyImageUpload } = require('../middleware/uploadMiddleware');
const Property = require('../models/Property');
const router = express.Router();

// Add property with images
router.post('/add-property', authenticate, authorize(['owner']), handlePropertyImageUpload, async (req, res) => {
  try {
    // Validate minimum 3 images
    if (!req.files || req.files.length < 3) {
      // Clean up any uploaded files
      if (req.files) {
        req.files.forEach(file => fs.unlinkSync(file.path));
      }
      return res.status(400).json({ message: 'Please upload at least 3 images' });
    }

    // Get image paths (relative URLs)
    const imagePaths = req.files.map(file => `/uploads/properties/${file.filename}`);

    // Parse amenities and meals if they come as strings
    let amenities = req.body.amenities;
    let meals = req.body.meals;
    
    if (typeof amenities === 'string') {
      amenities = amenities.split(',').map(a => a.trim()).filter(Boolean);
    }
    if (typeof meals === 'string') {
      meals = meals.split(',').map(m => m.trim()).filter(Boolean);
    }

    // Parse coordinates if they come as a string
    let coordinates = req.body.coordinates;
    if (typeof coordinates === 'string') {
      try {
        coordinates = JSON.parse(coordinates);
      } catch (e) {
        coordinates = null;
      }
    }

    const property = new Property({ 
      owner: req.user._id,
      title: req.body.title,
      description: req.body.description,
      rent: Number(req.body.rent),
      location: req.body.location,
      amenities: amenities || [],
      meals: meals || [],
      images: imagePaths,
      coordinates: coordinates || null
    });
    
    await property.save();
    res.status(201).json({ message: 'Property added', property });
  } catch (err) {
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all properties of this owner
router.get('/my-properties', authenticate, authorize(['owner']), async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user._id });
    res.json(properties);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update property
router.put('/property/:id', authenticate, authorize(['owner']), async (req, res) => {
  try {
    const property = await Property.findOne({ _id: req.params.id, owner: req.user._id });
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found or unauthorized' });
    }

    // Update only allowed fields
    const allowedUpdates = ['title', 'description', 'rent', 'location', 'amenities', 'meals', 'images', 'coordinates'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        // Parse coordinates if it's a string
        if (field === 'coordinates' && typeof req.body[field] === 'string') {
          try {
            updates[field] = JSON.parse(req.body[field]);
          } catch (e) {
            updates[field] = null;
          }
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({ message: 'Property updated', property: updatedProperty });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete property
router.delete('/property/:id', authenticate, authorize(['owner']), async (req, res) => {
  try {
    const property = await Property.findOne({ _id: req.params.id, owner: req.user._id });
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found or unauthorized' });
    }

    await Property.findByIdAndDelete(req.params.id);
    res.json({ message: 'Property deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
