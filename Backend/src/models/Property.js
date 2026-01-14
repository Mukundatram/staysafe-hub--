const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: String,
  rent: { type: Number, required: true },
  amenities: [String],
  meals: { type: [String], default: [] },
  location: { type: String },
  // Coordinates for map display (Leaflet.js + OpenStreetMap)
  coordinates: {
    lat: { type: Number },
    lng: { type: Number },
  },
  images: { 
    type: [String], 
    default: [],
    validate: {
      validator: function(v) {
        return v.length >= 0 && v.length <= 6;
      },
      message: 'Property can have at most 6 images'
    }
  },
  isAvailable: { type: Boolean, default: true },
  // Review and rating fields
  averageRating: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: { 
    type: Number, 
    default: 0 
  },
  ratingBreakdown: {
    cleanliness: { type: Number, default: 0 },
    location: { type: Number, default: 0 },
    value: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    amenities: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Index for geospatial queries (optional, for future features like nearby search)
propertySchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });

module.exports = mongoose.model('Property', propertySchema);
