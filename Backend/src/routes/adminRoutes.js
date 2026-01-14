const express = require('express');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const Booking = require('../models/Booking');
const router = express.Router();

// Approve or reject booking
router.put('/booking/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { status } = req.body; // Confirmed or Rejected
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = status;
    await booking.save();
    res.json({ message: 'Booking updated', booking });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
