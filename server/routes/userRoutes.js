const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile,
  getUsers,
  getUserById,
  updateUserRole,
  getUserStatistics,
  initializeUserStatistics
} = require('../controllers/userController');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/profile', auth, getUserProfile);
router.put('/profile', auth, updateUserProfile);
router.get('/statistics', auth, getUserStatistics);
router.get('/:id/statistics', auth, getUserStatistics);

// Admin-only routes (not accessible from UI)
router.post('/initialize-statistics', auth, initializeUserStatistics);

// Admin routes
router.get('/', auth, getUsers);
router.get('/:id', auth, getUserById);
router.put('/:id/role', auth, updateUserRole);

module.exports = router; 