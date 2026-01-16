const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  roomName: { type: String },
  roomNumber: { type: String },
  roomType: { type: String, enum: ['single', 'double', 'triple', 'dorm', 'other'], default: 'single' },
  maxOccupancy: { type: Number, default: 1, min: 1 },
  totalRooms: { type: Number, default: 1, min: 1 },
  availableRooms: { type: Number, default: 1, min: 0 },
  pricePerBed: { type: Number, default: 0 },
  pricePerRoom: { type: Number, default: 0 },
  genderPreference: { type: String, enum: ['male', 'female', 'any'], default: 'any' }
}, { timestamps: true });

// Ensure availableRooms never exceeds totalRooms
roomSchema.pre('save', function(next) {
  if (this.availableRooms > this.totalRooms) {
    this.availableRooms = this.totalRooms;
  }
  next();
});

module.exports = mongoose.model('Room', roomSchema);
