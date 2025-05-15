const express = require('express');
const router = express.Router();
const { 
  getRescueRequests,
  getRescueRequestById,
  createRescueRequest,
  updateRescueRequest,
  deleteRescueRequest
} = require('../controllers/rescueRequestController');
const auth = require('../middleware/auth');

// Public routes
// None for rescue requests - all require authentication

// Protected routes
// GET /api/rescue-requests - Get all rescue requests with optional filtering
router.get('/', auth, getRescueRequests);

// GET /api/rescue-requests/:id - Get rescue request by ID
router.get('/:id', auth, getRescueRequestById);

// POST /api/rescue-requests - Create a new rescue request
router.post('/', auth, createRescueRequest);

// PUT /api/rescue-requests/:id - Update rescue request
router.put('/:id', auth, updateRescueRequest);

// DELETE /api/rescue-requests/:id - Delete rescue request
router.delete('/:id', auth, deleteRescueRequest);

module.exports = router; 