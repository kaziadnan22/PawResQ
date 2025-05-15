const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  breed: {
    type: String,
    trim: true
  },
  age: {
    type: Number,
    min: 0
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'unknown'],
    default: 'unknown'
  },
  size: {
    type: String,
    enum: ['small', 'medium', 'large', 'xlarge'],
    default: 'medium'
  },
  description: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['available', 'adopted', 'pending', 'foster'],
    default: 'available'
  },
  location: {
    type: String,
    required: true
  },
  healthInfo: {
    vaccinated: {
      type: Boolean,
      default: false
    },
    neutered: {
      type: Boolean,
      default: false
    },
    specialNeeds: {
      type: Boolean,
      default: false
    }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const Pet = mongoose.model('Pet', petSchema);

module.exports = Pet; 