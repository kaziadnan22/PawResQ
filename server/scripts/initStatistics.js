require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const initializeStatistics = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users in database`);
    
    // Initialize statistics for all users
    let updatedCount = 0;
    for (const user of users) {
      // Make sure statistics exists and has all required fields
      user.statistics = {
        rescuesCompleted: user.statistics?.rescuesCompleted || 0,
        rescuesInProgress: user.statistics?.rescuesInProgress || 0,
        rescuesRescued: user.statistics?.rescuesRescued || 0,
        saveCount: user.statistics?.saveCount || 0,
        helpCount: user.statistics?.helpCount || 0,
        requestsSubmitted: user.statistics?.requestsSubmitted || 0,
        requestsApproved: user.statistics?.requestsApproved || 0,
        requestsRejected: user.statistics?.requestsRejected || 0
      };
      
      // Save the user
      await user.save();
      updatedCount++;
      console.log(`Updated statistics for user ${user.username} (${user._id})`);
    }
    
    console.log(`Successfully initialized/updated statistics for ${updatedCount} users`);
  } catch (error) {
    console.error('Error initializing statistics:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the function
initializeStatistics(); 