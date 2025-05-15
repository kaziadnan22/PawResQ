const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Import routes
const userRoutes = require('./routes/userRoutes');
const petRoutes = require('./routes/petRoutes');
const rescuedPetRoutes = require('./routes/rescuedPetRoutes');
const rescueRequestRoutes = require('./routes/rescueRequestRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Load environment variables
dotenv.config();

// Check if JWT_SECRET is configured
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET is not defined in the environment variables!');
  console.error('Authentication will not work without this setting.');
  // Set a default for development only
  process.env.JWT_SECRET = 'default_development_jwt_secret_not_for_production';
} else {
  console.log('JWT_SECRET is configured correctly');
}

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({
  limit: '50mb' // Allow larger payloads for image uploads
}));

// Default route
app.get('/', (req, res) => {
  res.send('PawResQ API is running');
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/rescued-pets', rescuedPetRoutes);
app.use('/api/rescue-requests', rescueRequestRoutes);
app.use('/api/notifications', notificationRoutes);

// Connect to MongoDB
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
  }); 