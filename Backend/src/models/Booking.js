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
  completionReason: { type: String }, // Optional reason for leaving early

  // Roommate collaboration fields (optional, for joint bookings)
  roommateConnection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoommateRequest',
    required: false
  },
  coOccupants: {
    type: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      status: {
        type: String,
        enum: ['pending', 'confirmed', 'declined'],
        default: 'pending'
      },
      confirmedAt: { type: Date }
    }],
    default: []
  },

  // Room Share Discovery fields (User B joins User A's existing booking)
  openToRoommate: {
    type: Boolean,
    default: false,
    index: true  // For efficient querying of available shares
  },
  joinRequests: {
    type: [{
      requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending'
      },
      message: {
        type: String,
        maxlength: 500
      },
      requestedAt: {
        type: Date,
        default: Date.now
      },
      respondedAt: Date
    }],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
