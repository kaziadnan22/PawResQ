const RescueRequest = require('../models/RescueRequest');
const User = require('../models/User');

// Get all rescue requests with optional filtering
exports.getRescueRequests = async (req, res) => {
  try {
    const { status, informerId, assignedTo } = req.query;
    const filter = {};

    if (status) {
      if (Array.isArray(status)) {
        filter.status = { $in: status };
      } else {
        filter.status = status;
      }
    }

    if (informerId) {
      filter.informer = informerId;
    }

    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    const rescueRequests = await RescueRequest.find(filter)
      .populate('informer', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ created: -1 });
      
    res.json(rescueRequests);
  } catch (error) {
    console.error('Error fetching rescue requests:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get rescue request by ID
exports.getRescueRequestById = async (req, res) => {
  try {
    const rescueRequest = await RescueRequest.findById(req.params.id)
      .populate('informer', 'name email')
      .populate('assignedTo', 'name email');
    
    if (!rescueRequest) {
      return res.status(404).json({ message: 'Rescue request not found' });
    }
    
    res.json(rescueRequest);
  } catch (error) {
    console.error('Error fetching rescue request:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create a new rescue request
exports.createRescueRequest = async (req, res) => {
  try {
    console.log('Creating rescue request with body:', JSON.stringify(req.body));
    console.log('User from request:', req.user ? `ID: ${req.user._id}, Role: ${req.user.role}` : 'No user data');
    
    const { description, location, imageUrl } = req.body;
    
    // Validate required fields
    if (!description || !location) {
      console.log('Validation failed: Missing description or location');
      return res.status(400).json({ message: 'Description and location are required' });
    }

    if (!req.user || !req.user._id) {
      console.log('Authentication error: No user data in request');
      return res.status(401).json({ message: 'User authentication required to create a request' });
    }

    // Create the rescue request with the authenticated user as the informer
    const rescueRequest = new RescueRequest({
      informer: req.user._id, // Use the authenticated user's ID
      description,
      location,
      imageUrl,
      status: 'pending',
      // Add an initial update to track creation
      updates: [{ message: 'Rescue request created', timestamp: new Date() }]
    });

    console.log('Saving rescue request with informer ID:', req.user._id);
    const savedRequest = await rescueRequest.save();
    
    // Update user statistics
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 
        'statistics.requestsSubmitted': 1,
        'statistics.helpCount': 1 
      }
    });
    
    // Populate informer details before sending response
    const populatedRequest = await RescueRequest.findById(savedRequest._id)
      .populate('informer', 'name email');
    
    console.log('Rescue request created successfully with ID:', savedRequest._id);
    res.status(201).json(populatedRequest);
  } catch (error) {
    console.error('Error creating rescue request:', error);
    // Provide more specific error message
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error: ' + error.message });
    } else if (error.name === 'MongoError' && error.code === 11000) {
      return res.status(400).json({ message: 'Duplicate entry error' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Update a rescue request
exports.updateRescueRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log(`Update request for rescue request ID: ${id}`);
    console.log('Update data:', JSON.stringify(updates));
    console.log('User making request:', `ID: ${req.user._id}, Role: ${req.user.role}`);
    
    const rescueRequest = await RescueRequest.findById(id);
    
    if (!rescueRequest) {
      console.log(`Rescue request not found with ID: ${id}`);
      return res.status(404).json({ message: 'Rescue request not found' });
    }
    
    console.log('Current request status:', rescueRequest.status);
    console.log('Assigned to:', rescueRequest.assignedTo ? rescueRequest.assignedTo.toString() : 'None');
    
    // Check for valid status transitions
    if (updates.status && rescueRequest.status !== updates.status) {
      console.log(`Status transition requested: ${rescueRequest.status} -> ${updates.status}`);
      
      // Define valid status transitions
      const validStatusTransitions = {
        'pending': ['approved', 'rejected'],
        'approved': ['assigned', 'rejected'],
        'assigned': ['rescued', 'in-progress', 'cancelled'],
        'rescued': ['completed'],
        'in-progress': ['rescued', 'completed', 'cancelled']
      };
      
      const isValidTransition = validStatusTransitions[rescueRequest.status] && 
                               validStatusTransitions[rescueRequest.status].includes(updates.status);
      
      if (!isValidTransition) {
        console.log(`Invalid status transition from ${rescueRequest.status} to ${updates.status}`);
        return res.status(400).json({ 
          message: `Invalid status transition from ${rescueRequest.status} to ${updates.status}` 
        });
      }
      
      // Update user statistics based on status transitions
      if (updates.status === 'approved' && rescueRequest.informer) {
        // Increment the informer's approved requests count and help count
        console.log(`Incrementing requestsApproved and helpCount for informer: ${rescueRequest.informer}`);
        await User.findByIdAndUpdate(rescueRequest.informer, {
          $inc: { 
            'statistics.requestsApproved': 1,
            'statistics.helpCount': 1 
          }
        });
        
        // If there's an assignedTo field, update the assignment status only (no saveCount yet)
        if (updates.assignedTo) {
          console.log(`Request assigned to volunteer: ${updates.assignedTo}`);
          // No statistics increment here as this is part of the assignment process, not completion
        }
      } else if (updates.status === 'rejected' && rescueRequest.informer) {
        // Increment the informer's rejected requests count
        console.log(`Incrementing requestsRejected for informer: ${rescueRequest.informer}`);
        await User.findByIdAndUpdate(rescueRequest.informer, {
          $inc: { 'statistics.requestsRejected': 1 }
        });
      } else if (updates.status === 'rescued' && rescueRequest.assignedTo) {
        // When volunteer marks as rescued, update the rescued count but don't change in-progress
        console.log(`Updating rescued count for volunteer: ${rescueRequest.assignedTo}`);
        await User.findByIdAndUpdate(rescueRequest.assignedTo, {
          $inc: { 'statistics.rescuesRescued': 1 }  // This is a new statistic specifically for rescued animals
        });
      } else if (updates.status === 'completed' && rescueRequest.assignedTo) {
        // When rescue is marked as completed - increment completed count and saveCount
        console.log(`Updating stats for volunteer: ${rescueRequest.assignedTo} - completing rescue`);
        
        // Check previous status to determine what to decrement
        if (rescueRequest.status === 'rescued' || rescueRequest.status === 'in-progress' || rescueRequest.status === 'assigned') {
          // Decrement in-progress and increment completed and saveCount
          await User.findByIdAndUpdate(rescueRequest.assignedTo, {
            $inc: { 
              'statistics.rescuesInProgress': -1,
              'statistics.rescuesCompleted': 1,
              'statistics.saveCount': 1 // Increment save count when task is completed
            }
          });
        } else {
          // Just increment completed and saveCount
          await User.findByIdAndUpdate(rescueRequest.assignedTo, {
            $inc: { 
              'statistics.rescuesCompleted': 1,
              'statistics.saveCount': 1 // Increment save count when task is completed
            }
          });
        }
      } else if (updates.status === 'assigned' && updates.assignedTo) {
        // When a request is assigned, increment volunteer's in-progress count
        console.log(`Incrementing rescuesInProgress for volunteer: ${updates.assignedTo}`);
        await User.findByIdAndUpdate(updates.assignedTo, {
          $inc: { 'statistics.rescuesInProgress': 1 }
        });
      } else if (updates.status === 'in-progress' && rescueRequest.assignedTo) {
        // No change in statistics for in-progress, as it was already counted in assigned
        console.log(`Status updated to in-progress for volunteer: ${rescueRequest.assignedTo}`);
      }
    }
    
    // Check authorization based on role and request status
    const isAuthorized = 
      req.user.role === 'admin' || 
      req.user.role === 'teamLeader' || 
      req.user.role === 'requestChecker' ||
      (req.user.role === 'volunteer' && rescueRequest.assignedTo && 
       rescueRequest.assignedTo.toString() === req.user._id.toString()) ||
      (req.user.role === 'informer' && rescueRequest.informer.toString() === req.user._id.toString() && 
       rescueRequest.status === 'pending');
    
    if (!isAuthorized) {
      console.log('Authorization failed for update request');
      console.log('User role:', req.user.role);
      console.log('Request assigned to:', rescueRequest.assignedTo);
      console.log('Request created by:', rescueRequest.informer);
      
      return res.status(403).json({ message: 'Not authorized to update this rescue request' });
    }
    
    console.log('Update authorized, applying changes...');
    
    // Update the rescue request
    const updatedRequest = await RescueRequest.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('informer', 'name email')
     .populate('assignedTo', 'name email');
    
    console.log('Update successful, new status:', updatedRequest.status);
    res.json(updatedRequest);
  } catch (error) {
    console.error('Error updating rescue request:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error: ' + error.message });
    }
    
    res.status(500).json({ message: error.message });
  }
};

// Delete a rescue request
exports.deleteRescueRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const rescueRequest = await RescueRequest.findById(id);
    
    if (!rescueRequest) {
      return res.status(404).json({ message: 'Rescue request not found' });
    }
    
    // Only admins, request checkers, or the original informer (if status is pending) can delete
    const isAuthorized = 
      req.user.role === 'admin' || 
      req.user.role === 'requestChecker' ||
      (req.user.role === 'informer' && 
       rescueRequest.informer.toString() === req.user._id.toString() && 
       rescueRequest.status === 'pending');
    
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to delete this rescue request' });
    }
    
    await RescueRequest.findByIdAndDelete(id);
    
    res.json({ message: 'Rescue request deleted successfully' });
  } catch (error) {
    console.error('Error deleting rescue request:', error);
    res.status(500).json({ message: error.message });
  }
}; 