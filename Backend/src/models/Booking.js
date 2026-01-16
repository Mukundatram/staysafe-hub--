const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  // Optional: reference to a Room when booking a specific room/bed
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: false },
  // Number of rooms requested (inventory count). Default 1 for backward compatibility.
  roomsCount: { type: Number, default: 1, min: 1 },
  // Number of members for the booking (for bed-based pricing)
  membersCount: { type: Number, default: 1, min: 1 },
  mealsSelected: { type: Boolean, default: false },
  // Optional link to a mess subscription created along with the booking
  messSubscription: { type: mongoose.Schema.Types.ObjectId, ref: 'MessSubscription', required: false },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Rejected', 'Completed', 'Cancelled'], default: 'Pending' },
  completedAt: { type: Date }, // When the student left/completed the stay
  completionReason: { type: String } // Optional reason for leaving early
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
