const mongoose = require('mongoose');

const rescueRequestSchema = new mongoose.Schema({
  informer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  coordinates: {
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
    }
  },
  imageUrl: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'assigned', 'rescued', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updates: [{
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  created: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const RescueRequest = mongoose.model('RescueRequest', rescueRequestSchema);

module.exports = RescueRequest; 