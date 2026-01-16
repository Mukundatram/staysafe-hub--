const express = require('express');
const path = require('path');
const fs = require('fs');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { handlePropertyImageUpload } = require('../middleware/uploadMiddleware');
const Property = require('../models/Property');
const Room = require('../models/Room');
const MessSubscription = require('../models/MessSubscription');
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
        coordinates: coordinates || null,
        linkedMess: req.body.linkedMess || null,
      });
    
    await property.save();
    // If owner provided initial room inventory fields, create a default Room for convenience
    try {
      const { totalRooms, maxOccupancy, pricePerBed } = req.body;
      if (totalRooms && parseInt(totalRooms) > 0) {
        const room = new Room({
          property: property._id,
          roomName: req.body.roomName || `${property.title} - Room`,
          roomNumber: req.body.roomNumber || '',
          roomType: req.body.roomType || 'single',
          maxOccupancy: Math.max(1, parseInt(maxOccupancy) || 1),
          totalRooms: parseInt(totalRooms),
          availableRooms: Math.min(parseInt(req.body.availableRooms) || parseInt(totalRooms), parseInt(totalRooms)),
          pricePerBed: Number(pricePerBed) || 0,
          pricePerRoom: Number(req.body.pricePerRoom) || 0,
          genderPreference: req.body.genderPreference || 'any'
        });
        await room.save();
      }
    } catch (roomErr) {
      console.error('Failed to create initial room inventory:', roomErr);
      // Don't fail property creation for room creation errors
    }

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

// Rooms management for a property
router.post('/property/:id/rooms', authenticate, authorize(['owner']), async (req, res) => {
  console.log('[ownerRoutes] POST /property/:id/rooms called', {
    user: req.user ? req.user._id : null,
    params: req.params,
    bodyKeys: req.body ? Object.keys(req.body) : null
  });
  try {
    const property = await Property.findOne({ _id: req.params.id, owner: req.user._id });
    if (!property) return res.status(404).json({ message: 'Property not found or unauthorized' });

    const { roomName, roomNumber, roomType, maxOccupancy, totalRooms, availableRooms, pricePerBed, pricePerRoom, genderPreference } = req.body;

    // Basic validation
    if (!totalRooms || totalRooms < 1) return res.status(400).json({ message: 'totalRooms must be at least 1' });
    const room = new Room({
      property: property._id,
      roomName,
      roomNumber,
      roomType,
      maxOccupancy: Math.max(1, parseInt(maxOccupancy) || 1),
      totalRooms: parseInt(totalRooms),
      availableRooms: Math.min(parseInt(availableRooms) || parseInt(totalRooms), parseInt(totalRooms)),
      pricePerBed: Number(pricePerBed) || 0,
      pricePerRoom: Number(pricePerRoom) || 0,
      genderPreference: genderPreference || 'any'
    });

    await room.save();
    res.status(201).json({ message: 'Room added', room });
  } catch (err) {
    console.error('Add room error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// List rooms for a property (owner)
router.get('/property/:id/rooms', authenticate, authorize(['owner']), async (req, res) => {
  try {
    const property = await Property.findOne({ _id: req.params.id, owner: req.user._id });
    if (!property) return res.status(404).json({ message: 'Property not found or unauthorized' });
    const rooms = await Room.find({ property: property._id });
    res.json(rooms);
  } catch (err) {
    console.error('List rooms error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update room
router.patch('/property/:id/rooms/:roomId', authenticate, authorize(['owner']), async (req, res) => {
  try {
    const property = await Property.findOne({ _id: req.params.id, owner: req.user._id });
    if (!property) return res.status(404).json({ message: 'Property not found or unauthorized' });
    const room = await Room.findOne({ _id: req.params.roomId, property: property._id });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    const updates = {};
    ['roomName','roomNumber','roomType','maxOccupancy','totalRooms','availableRooms','pricePerBed','pricePerRoom','genderPreference'].forEach(k => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    // If owner is trying to reduce totalRooms, ensure it doesn't go below currently confirmed bookings
    if (updates.totalRooms !== undefined) {
      const Booking = require('../models/Booking');
      const newTotal = parseInt(updates.totalRooms);
      if (isNaN(newTotal) || newTotal < 1) {
        return res.status(400).json({ message: 'totalRooms must be a positive integer' });
      }
      // Count confirmed bookings that reference this room
      const confirmedCount = await Booking.countDocuments({ room: room._id, status: 'Confirmed' });
      if (newTotal < confirmedCount) {
        return res.status(400).json({ message: `Cannot set totalRooms to ${newTotal} — there are already ${confirmedCount} confirmed bookings for this room` });
      }
      // Adjust availableRooms to reflect new total minus occupied
      const adjustedAvailable = Math.max(0, newTotal - confirmedCount);
      updates.availableRooms = Math.min(adjustedAvailable, parseInt(updates.availableRooms) || adjustedAvailable);
    }

    const updated = await Room.findByIdAndUpdate(room._id, { $set: updates }, { new: true, runValidators: true });
    res.json({ message: 'Room updated', room: updated });
  } catch (err) {
    console.error('Update room error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete room
router.delete('/property/:id/rooms/:roomId', authenticate, authorize(['owner']), async (req, res) => {
  try {
    const property = await Property.findOne({ _id: req.params.id, owner: req.user._id });
    if (!property) return res.status(404).json({ message: 'Property not found or unauthorized' });
    const room = await Room.findOne({ _id: req.params.roomId, property: property._id });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    await Room.deleteOne({ _id: room._id });
    res.json({ message: 'Room deleted' });
  } catch (err) {
    console.error('Delete room error:', err);
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
    const allowedUpdates = ['title', 'description', 'rent', 'location', 'amenities', 'meals', 'images', 'coordinates', 'linkedMess'];
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

    // If owner is attempting to change or remove linkedMess, ensure there are no active/pending subscriptions
    if (updates.hasOwnProperty('linkedMess')) {
      const newLinked = updates.linkedMess || null;
      const oldLinked = property.linkedMess ? property.linkedMess.toString() : null;
      // If removing or changing from an existing linked mess, check subscriptions for the old mess
      if (oldLinked && (!newLinked || newLinked.toString() !== oldLinked)) {
        const subsCount = await MessSubscription.countDocuments({ mess: oldLinked, status: { $in: ['Active', 'Pending'] } });
        if (subsCount > 0) {
          return res.status(400).json({ message: `Cannot unlink/change mess: there are ${subsCount} active or pending subscriptions for the currently linked mess.` });
        }
      }
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    // If owner provided inventory fields and property currently has no rooms, create an initial Room
    try {
      const { totalRooms, maxOccupancy, pricePerBed } = req.body;
      const existingRooms = await Room.countDocuments({ property: updatedProperty._id });
      if (totalRooms && parseInt(totalRooms) > 0 && existingRooms === 0) {
        const room = new Room({
          property: updatedProperty._id,
          roomName: req.body.roomName || `${updatedProperty.title} - Room`,
          roomNumber: req.body.roomNumber || '',
          roomType: req.body.roomType || 'single',
          maxOccupancy: Math.max(1, parseInt(maxOccupancy) || 1),
          totalRooms: parseInt(totalRooms),
          availableRooms: Math.min(parseInt(req.body.availableRooms) || parseInt(totalRooms), parseInt(totalRooms)),
          pricePerBed: Number(pricePerBed) || 0,
          pricePerRoom: Number(req.body.pricePerRoom) || 0,
          genderPreference: req.body.genderPreference || 'any'
        });
        await room.save();
      }
    } catch (roomErr) {
      console.error('Failed to create initial room on property update:', roomErr);
    }

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
