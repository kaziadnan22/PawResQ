const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No authentication token provided');
      return res.status(401).json({ message: 'Authentication required - No token provided' });
    }

    try {
      // Log the token and JWT secret for debugging
      console.log('JWT Secret configured:', process.env.JWT_SECRET ? 'Yes (length: ' + process.env.JWT_SECRET.length + ')' : 'No');
      console.log('Received token:', token.substring(0, 15) + '...');
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully, user ID:', decoded.id);
      
      const user = await User.findById(decoded.id);

      if (!user) {
        console.log(`User not found for ID: ${decoded.id}`);
        return res.status(401).json({ message: 'Authentication failed - User not found' });
      }

      console.log(`User authenticated: ${user._id} (${user.role})`);
      req.user = user;
      req.token = token;
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError.message);
      return res.status(401).json({ message: 'Authentication failed - Invalid or expired token' });
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(401).json({ message: 'Authentication failed - Server error' });
  }
};

module.exports = auth; 