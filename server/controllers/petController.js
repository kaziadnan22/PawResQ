const Pet = require('../models/Pet');

// Get all pets with optional filtering
exports.getPets = async (req, res) => {
  try {
    const { type, status, location } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (location) filter.location = { $regex: location, $options: 'i' };

    const pets = await Pet.find(filter);
    res.json(pets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get pet by ID
exports.getPetById = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id).populate('owner', 'name email');
    
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }
    
    res.json(pet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new pet
exports.createPet = async (req, res) => {
  try {
    const {
      name,
      type,
      breed,
      age,
      gender,
      size,
      description,
      images,
      status,
      location,
      healthInfo
    } = req.body;

    const pet = new Pet({
      name,
      type,
      breed,
      age,
      gender,
      size,
      description,
      images,
      status,
      location,
      healthInfo,
      owner: req.user._id
    });

    const createdPet = await pet.save();
    res.status(201).json(createdPet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a pet
exports.updatePet = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Check if the user is the owner or an admin
    if (pet.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this pet' });
    }

    const updatedPet = await Pet.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedPet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a pet
exports.deletePet = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Check if the user is the owner or an admin
    if (pet.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this pet' });
    }

    await Pet.findByIdAndDelete(req.params.id);
    res.json({ message: 'Pet removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 