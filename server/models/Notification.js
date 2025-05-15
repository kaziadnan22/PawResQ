const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    trim: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  targetRole: {
    type: String,
    enum: ['volunteer', 'teamLeader', 'requestChecker', 'receptionist', 'informer', 'admin']
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  rescueRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RescueRequest'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 