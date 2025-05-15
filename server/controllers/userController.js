const User = require('../models/User');
const jwt = require('jsonwebtoken');
const RescueRequest = require('../models/RescueRequest');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Register a new user
exports.registerUser = async (req, res) => {
  try {
    const { name, username, email, password, role, area } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ 
      $or: [
        { email },
        { username }
      ]
    });
    
    if (userExists) {
      if (userExists.username === username) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Validate role
    const validRoles = ['volunteer', 'teamLeader', 'requestChecker', 'receptionist', 'informer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if area is provided for volunteers
    if (role === 'volunteer' && !area) {
      return res.status(400).json({ message: 'Area is required for volunteers' });
    }

    // Initialize statistics based on user role - explicitly define the entire object
    const statistics = {
      rescuesCompleted: 0,
      rescuesInProgress: 0,
      rescuesRescued: 0,
      saveCount: 0,
      helpCount: 0,
      requestsSubmitted: 0,
      requestsApproved: 0,
      requestsRejected: 0
    };

    // Create new user
    const user = await User.create({
      name,
      username,
      email,
      password,
      role,
      area: role === 'volunteer' ? area : undefined,
      statistics // Add initialized statistics
    });

    if (user) {
      console.log(`Created new ${role} with initialized statistics counters:`, JSON.stringify(statistics));
      
      res.status(201).json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        area: user.area,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: error.message });
  }
};

// Login user
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Update last login time
    user.lastLogin = Date.now();
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      area: user.area,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      // Ensure statistics exists
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
        await user.save();
        console.log('Added missing statistics to user profile:', user._id);
      }
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.profilePicture = req.body.profilePicture || user.profilePicture;
    
    // Only allow area update if the user is a volunteer
    if (user.role === 'volunteer' && req.body.area) {
      user.area = req.body.area;
    }

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      area: updatedUser.area,
      profilePicture: updatedUser.profilePicture,
      token: generateToken(updatedUser._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all users (admin only)
exports.getUsers = async (req, res) => {
  try {
    // Check if requesting user is admin or team leader
    if (req.user.role !== 'admin' && req.user.role !== 'teamLeader') {
      return res.status(403).json({ message: 'Not authorized to view all users' });
    }
    
    // Build filter based on query parameters
    const filter = {};
    
    // Filter by role if provided
    if (req.query.role) {
      filter.role = req.query.role;
    }
    
    // Filter by active status if provided
    if (req.query.isActive === 'true') {
      filter.isActive = true;
    } else if (req.query.isActive === 'false') {
      filter.isActive = false;
    }
    
    const users = await User.find(filter).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user by ID (admin only)
exports.getUserById = async (req, res) => {
  try {
    // Check if requesting user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'teamLeader') {
      return res.status(403).json({ message: 'Not authorized to view user details' });
    }
    
    const user = await User.findById(req.params.id).select('-password');
    
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user role (admin only)
exports.updateUserRole = async (req, res) => {
  try {
    // Check if requesting user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update user roles' });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const { role } = req.body;
    
    // Validate role
    const validRoles = ['volunteer', 'teamLeader', 'requestChecker', 'receptionist', 'informer', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    user.role = role;
    
    // If changing to volunteer and no area is set, require area
    if (role === 'volunteer' && !user.area && !req.body.area) {
      return res.status(400).json({ message: 'Area is required for volunteers' });
    }
    
    if (role === 'volunteer' && req.body.area) {
      user.area = req.body.area;
    }
    
    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      area: updatedUser.area
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user statistics
exports.getUserStatistics = async (req, res) => {
  try {
    const userId = req.params.id || req.user._id;
    
    // If requesting another user's stats, check authorization
    if (req.params.id && req.params.id !== req.user._id.toString()) {
      // Only admin or team leader can view other user's stats
      if (req.user.role !== 'admin' && req.user.role !== 'teamLeader') {
        return res.status(403).json({ message: 'Not authorized to view other user statistics' });
      }
    }
    
    console.log(`Getting statistics for user ID: ${userId}`);
    const user = await User.findById(userId).select('name role statistics');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Create empty statistics object if it doesn't exist
    if (!user.statistics) {
      console.log('User statistics not found, initializing empty statistics');
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
      await user.save();
    }
    
    console.log('User statistics found:', user.statistics);
    
    // For volunteers, get more detailed rescue information
    if (user.role === 'volunteer') {
      // Add additional rescue request statistics
      const rescuedRequests = await RescueRequest.find({ 
        assignedTo: userId,
        status: 'rescued'
      }).count();
      
      const completedRequests = await RescueRequest.find({ 
        assignedTo: userId,
        status: 'completed'
      }).count();
      
      const inProgressRequests = await RescueRequest.find({ 
        assignedTo: userId,
        status: { $in: ['assigned', 'in-progress'] }
      }).count();
      
      // Count only completed rescues for save count if not already in user object
      const saveCount = user.statistics.saveCount || completedRequests;
      
      // Make sure we have the correct statistics in the response
      res.json({
        ...user.toObject(),
        statistics: {
          ...user.statistics.toObject(),
          rescuedRequests,
          completedRequests,
          inProgressRequests,
          // Ensure the rescuesRescued field is properly populated in case it's missing from DB
          rescuesRescued: user.statistics.rescuesRescued || rescuedRequests,
          saveCount: saveCount
        }
      });
    } 
    // For informers, get more detailed request information
    else if (user.role === 'informer') {
      // Add additional rescue request statistics
      const pendingRequests = await RescueRequest.find({ 
        informer: userId,
        status: 'pending'
      }).count();
      
      const approvedRequests = await RescueRequest.find({ 
        informer: userId,
        status: { $in: ['approved', 'assigned', 'in-progress', 'rescued', 'completed'] }
      }).count();
      
      const rejectedRequests = await RescueRequest.find({ 
        informer: userId,
        status: 'rejected'
      }).count();
      
      const totalRequests = await RescueRequest.find({
        informer: userId
      }).count();
      
      // Calculate help count if not already in user object
      const helpCount = user.statistics.helpCount || totalRequests;
      
      res.json({
        ...user.toObject(),
        statistics: {
          ...user.statistics.toObject(),
          pendingRequests,
          approvedRequests,
          rejectedRequests,
          totalRequests,
          helpCount: helpCount
        }
      });
    } else {
      // For other roles, just return basic statistics
      res.json(user);
    }
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ message: error.message });
  }
};

// Initialize statistics for all users
exports.initializeUserStatistics = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to perform this action' });
    }
    
    // Fetch all users that don't have statistics or have incomplete statistics
    const users = await User.find({
      $or: [
        { statistics: { $exists: false } },
        { statistics: null }
      ]
    });
    
    console.log(`Found ${users.length} users without statistics`);
    
    // Update each user to add statistics
    let updatedCount = 0;
    for (const user of users) {
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
      await user.save();
      updatedCount++;
    }
    
    console.log(`Statistics initialized for ${updatedCount} users`);
    
    res.status(200).json({ 
      message: `Successfully initialized statistics for ${updatedCount} users`
    });
  } catch (error) {
    console.error('Error initializing user statistics:', error);
    res.status(500).json({ message: error.message });
  }
}; 