const express = require('express');
const router = express.Router();
const { 
  getRescuedPets,
  getRescueStats,
  getRescuedPetById,
  createRescuedPet,
  updateRescuedPet,
  deleteRescuedPet
} = require('../controllers/rescuedPetController');
const auth = require('../middleware/auth');

// Get rescue stats for dashboard (public)
router.get('/stats', getRescueStats);

// Public routes
router.get('/', getRescuedPets);
router.get('/:id', getRescuedPetById);

// Protected routes
router.post('/', auth, createRescuedPet);
router.put('/:id', auth, updateRescuedPet);
router.delete('/:id', auth, deleteRescuedPet);

module.exports = router; 