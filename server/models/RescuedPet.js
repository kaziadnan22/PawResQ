const mongoose = require('mongoose');

const rescuedPetSchema = new mongoose.Schema({
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
  rescueDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  rescueLocation: {
    type: String,
    required: true
  },
  condition: {
    type: String,
    enum: ['critical', 'poor', 'fair', 'good', 'excellent'],
    default: 'fair'
  },
  medicalNotes: {
    type: String,
    default: ''
  },
  treatmentStatus: {
    type: String,
    enum: ['pending', 'in-treatment', 'recovered', 'deceased'],
    default: 'pending'
  },
  images: [{
    type: String
  }],
  rescuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  currentCaretaker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adoptionStatus: {
    type: String,
    enum: ['not-ready', 'ready', 'pending', 'adopted'],
    default: 'not-ready'
  }
}, {
  timestamps: true
});

const RescuedPet = mongoose.model('RescuedPet', rescuedPetSchema);

module.exports = RescuedPet; 