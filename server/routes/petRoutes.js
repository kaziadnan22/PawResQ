const express = require('express');
const router = express.Router();
const { 
  getPets, 
  getPetById, 
  createPet, 
  updatePet, 
  deletePet 
} = require('../controllers/petController');
const auth = require('../middleware/auth');

// Public routes
router.get('/', getPets);
router.get('/:id', getPetById);

// Protected routes
router.post('/', auth, createPet);
router.put('/:id', auth, updatePet);
router.delete('/:id', auth, deletePet);

module.exports = router; 