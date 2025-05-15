const RescuedPet = require('../models/RescuedPet');

// Get all rescued pets with optional filtering
exports.getRescuedPets = async (req, res) => {
  try {
    const { type, condition, treatmentStatus, adoptionStatus } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (condition) filter.condition = condition;
    if (treatmentStatus) filter.treatmentStatus = treatmentStatus;
    if (adoptionStatus) filter.adoptionStatus = adoptionStatus;

    const rescuedPets = await RescuedPet.find(filter)
      .populate('rescuedBy', 'name')
      .populate('currentCaretaker', 'name');
      
    res.json(rescuedPets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get rescued pet stats for dashboard
exports.getRescueStats = async (req, res) => {
  try {
    const totalRescued = await RescuedPet.countDocuments();
    
    const byTreatmentStatus = await RescuedPet.aggregate([
      { $group: { _id: "$treatmentStatus", count: { $sum: 1 } } }
    ]);
    
    const byAdoptionStatus = await RescuedPet.aggregate([
      { $group: { _id: "$adoptionStatus", count: { $sum: 1 } } }
    ]);
    
    const byType = await RescuedPet.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } }
    ]);
    
    // Get monthly rescue counts for the current year
    const currentYear = new Date().getFullYear();
    const monthlyRescues = await RescuedPet.aggregate([
      {
        $match: {
          rescueDate: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { $month: "$rescueDate" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
    
    res.json({
      totalRescued,
      byTreatmentStatus,
      byAdoptionStatus,
      byType,
      monthlyRescues
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get rescued pet by ID
exports.getRescuedPetById = async (req, res) => {
  try {
    const rescuedPet = await RescuedPet.findById(req.params.id)
      .populate('rescuedBy', 'name email')
      .populate('currentCaretaker', 'name email');
    
    if (!rescuedPet) {
      return res.status(404).json({ message: 'Rescued pet not found' });
    }
    
    res.json(rescuedPet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new rescued pet entry
exports.createRescuedPet = async (req, res) => {
  try {
    const {
      name,
      type,
      breed,
      age,
      gender,
      rescueDate,
      rescueLocation,
      condition,
      medicalNotes,
      treatmentStatus,
      images,
      currentCaretaker,
      adoptionStatus
    } = req.body;

    const rescuedPet = new RescuedPet({
      name,
      type,
      breed,
      age,
      gender,
      rescueDate,
      rescueLocation,
      condition,
      medicalNotes,
      treatmentStatus,
      images,
      rescuedBy: req.user._id,
      currentCaretaker,
      adoptionStatus
    });

    const createdRescuedPet = await rescuedPet.save();
    res.status(201).json(createdRescuedPet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a rescued pet
exports.updateRescuedPet = async (req, res) => {
  try {
    const rescuedPet = await RescuedPet.findById(req.params.id);

    if (!rescuedPet) {
      return res.status(404).json({ message: 'Rescued pet not found' });
    }

    // Check if the user is authorized (admin, team leader, or the person who rescued)
    const isAuthorized = 
      req.user.role === 'admin' || 
      req.user.role === 'teamLeader' || 
      req.user.role === 'requestChecker' ||
      rescuedPet.rescuedBy.toString() === req.user._id.toString();

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to update this record' });
    }

    const updatedRescuedPet = await RescuedPet.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedRescuedPet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a rescued pet record
exports.deleteRescuedPet = async (req, res) => {
  try {
    const rescuedPet = await RescuedPet.findById(req.params.id);

    if (!rescuedPet) {
      return res.status(404).json({ message: 'Rescued pet not found' });
    }

    // Only admins and team leaders can delete records
    if (req.user.role !== 'admin' && req.user.role !== 'teamLeader') {
      return res.status(403).json({ message: 'Not authorized to delete this record' });
    }

    await RescuedPet.findByIdAndDelete(req.params.id);
    res.json({ message: 'Rescued pet record removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 