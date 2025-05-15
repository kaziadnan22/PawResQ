const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['volunteer', 'teamLeader', 'requestChecker', 'receptionist', 'informer', 'admin'],
    default: 'volunteer'
  },
  area: {
    type: String,
    required: function() { return this.role === 'volunteer'; },
    trim: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  statistics: {
    type: Object,
    required: true,
    default: {
      rescuesCompleted: 0,
      rescuesInProgress: 0,
      rescuesRescued: 0,
      saveCount: 0,
      helpCount: 0,
      requestsSubmitted: 0,
      requestsApproved: 0,
      requestsRejected: 0
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  
  // Ensure statistics exists before saving
  if (!user.statistics) {
    user.statistics = {
      rescuesCompleted: 0,
      rescuesInProgress: 0,
      rescuesRescued: 0,
      saveCount: 0,
      helpCount: 0,
      requestsSubmitted: 0,
      requestsApproved: 0,
      requestsRejected: 0
    };
  }
  
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 