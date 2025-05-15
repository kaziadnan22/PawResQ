const Notification = require('../models/Notification');
const User = require('../models/User');

// Get notifications for the current user or by role
exports.getNotifications = async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    const filter = {};
    
    // Filter by target user or role
    filter.$or = [
      { targetId: req.user._id },
      { targetRole: req.user.role }
    ];
    
    // Filter by read status if requested
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }
    
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .populate('rescueRequestId', 'description location status');
      
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get count of unread notifications
exports.getUnreadNotificationsCount = async (req, res) => {
  try {
    const filter = {
      $or: [
        { targetId: req.user._id },
        { targetRole: req.user.role }
      ],
      isRead: false
    };
    
    const count = await Notification.countDocuments(filter);
    res.json({ count });
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    res.status(500).json({ message: error.message });
  }
};

// Mark notifications as read
exports.markNotificationsAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    
    let filter = {};
    
    if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      filter = { _id: { $in: notificationIds } };
    } else {
      // Mark all notifications for this user as read
      filter = {
        $or: [
          { targetId: req.user._id },
          { targetRole: req.user.role }
        ],
        isRead: false
      };
    }
    
    await Notification.updateMany(
      filter,
      { isRead: true }
    );
    
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create a new notification
exports.createNotification = async (req, res) => {
  try {
    const { type, targetId, targetRole, content, rescueRequestId } = req.body;
    
    // Validation
    if (!type || (!targetId && !targetRole) || !content) {
      return res.status(400).json({ 
        message: 'Notification type, target (id or role), and content are required' 
      });
    }
    
    // Create notification
    const notification = new Notification({
      type,
      targetId,
      targetRole,
      content,
      rescueRequestId,
      isRead: false,
      createdAt: new Date()
    });
    
    const savedNotification = await notification.save();
    
    res.status(201).json(savedNotification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: error.message });
  }
}; 