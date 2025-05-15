const express = require('express');
const router = express.Router();
const { 
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationsAsRead,
  createNotification
} = require('../controllers/notificationController');
const auth = require('../middleware/auth');

// All routes are protected
router.get('/', auth, getNotifications);
router.get('/unread/count', auth, getUnreadNotificationsCount);
router.put('/mark-read', auth, markNotificationsAsRead);
router.post('/', auth, createNotification);

module.exports = router; 