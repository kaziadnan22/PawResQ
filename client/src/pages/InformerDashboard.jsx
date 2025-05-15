import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Divider,
  Grid,
  Box,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  Tab,
  Tabs,
  IconButton,
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HistoryIcon from '@mui/icons-material/History';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { useAuth } from '../context/AuthContext';
import { rescueRequestsAPI, getAuthToken } from '../services/api';
import { toast } from 'react-toastify';

const InformerDashboard = () => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    description: '',
    location: '',
    imageUrl: '',
  });
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (tabValue === 1) {
      fetchMyRequests();
    }
  }, [tabValue]);

  const fetchMyRequests = async () => {
    try {
      setLoadingHistory(true);
      const response = await rescueRequestsAPI.getRescueRequests({ informerId: currentUser._id });
      setMyRequests(response.data);
    } catch (err) {
      console.error('Error fetching my requests:', err);
      toast.error('Failed to load your rescue requests');
      // Set empty array for error case
      setMyRequests([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        // In a real app, you would upload this to a server and get back a URL
        // For demo purposes, we'll just set the data URL as the imageUrl
        setFormData({
          ...formData,
          imageUrl: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Verify user authentication status
    const token = getAuthToken();
    if (!currentUser || !currentUser._id || !token) {
      console.error('Authentication error:', { 
        hasCurrentUser: !!currentUser, 
        hasUserId: currentUser ? !!currentUser._id : false,
        hasToken: !!token 
      });
      toast.error('You must be logged in to submit a rescue request');
      return;
    }
    
    console.log('Submitting rescue request:', { 
      description: formData.description.substring(0, 30) + '...',
      location: formData.location,
      userInfo: {
        id: currentUser._id,
        role: currentUser.role
      },
      token: token ? `${token.substring(0, 10)}...` : 'missing'
    });

    try {
      setLoading(true);
      
      // In a real app, the following would handle image upload to cloud storage
      // For demo purposes, we'll skip this and just use the base64 or mock URL
      
      const requestData = {
        description: formData.description,
        location: formData.location,
        imageUrl: formData.imageUrl
      };

      const response = await rescueRequestsAPI.createRescueRequest(requestData);
      console.log('Rescue request submitted successfully:', response.data);
      
      toast.success('Rescue request submitted successfully');
      setFormData({
        description: '',
        location: '',
        imageUrl: ''
      });
      setSelectedImage(null);
      
      // Switch to the history tab and refresh the data
      setTabValue(1);
      fetchMyRequests();
    } catch (err) {
      console.error('Error submitting rescue request:', err);
      if (err.response) {
        console.error('Server response:', err.response.data);
        
        if (err.response.status === 401) {
          toast.error('Authentication failed. Please log in again.');
        } else if (err.response.status === 400) {
          toast.error(`Validation error: ${err.response.data.message}`);
        } else {
          toast.error(`Server error: ${err.response.data.message || 'Unknown error'}`);
        }
      } else if (err.request) {
        // Request was made but no response received
        toast.error('No response from server. Please check your connection.');
      } else {
        toast.error('Failed to submit rescue request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'pending': 'warning',
      'approved': 'info',
      'assigned': 'primary',
      'rescued': 'success',
      'completed': 'success',
      'rejected': 'error'
    };
    return statusMap[status] || 'default';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Check if user has the correct role
  if (currentUser && currentUser.role !== 'informer') {
    return (
      <Container maxWidth="md" sx={{ mt: 5 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" color="error" gutterBottom>
            Unauthorized Access
          </Typography>
          <Typography variant="body1">
            You do not have permission to access the Informer Dashboard.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Informer Dashboard
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Typography variant="body1" paragraph>
          Report animals in need of rescue by submitting a rescue request.
        </Typography>
        
        <Paper elevation={1} sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab icon={<AddCircleIcon />} label="New Request" />
            <Tab icon={<HistoryIcon />} label="My Requests" />
          </Tabs>
        </Paper>
        
        {tabValue === 0 && (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="description"
                  label="Description"
                  name="description"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the animal and its condition in detail"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="location"
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Provide the exact address or detailed location"
                  variant="outlined"
                  InputProps={{
                    startAdornment: <LocationOnIcon sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ border: '1px dashed grey', p: 3, borderRadius: 1, textAlign: 'center' }}>
                  {formData.imageUrl ? (
                    <Box sx={{ position: 'relative' }}>
                      <img 
                        src={formData.imageUrl} 
                        alt="Preview" 
                        style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '4px' }} 
                      />
                      <Button
                        variant="contained"
                        component="label"
                        sx={{ mt: 2 }}
                      >
                        Change Image
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={handleImageChange}
                        />
                      </Button>
                    </Box>
                  ) : (
                    <Button
                      variant="outlined"
                      startIcon={<AddPhotoAlternateIcon />}
                      component="label"
                    >
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleImageChange}
                      />
                    </Button>
                  )}
                  <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                    Add a clear photo of the animal to help the rescue team
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  disabled={loading}
                  sx={{ mt: 2, py: 1.5 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Submit Rescue Request'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {tabValue === 1 && (
          <>
            <Typography variant="h5" gutterBottom>
              My Rescue Requests
            </Typography>
            
            {loadingHistory ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : myRequests.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>You haven't submitted any rescue requests yet.</Alert>
            ) : (
              <Grid container spacing={3}>
                {myRequests.map((request) => (
                  <Grid item xs={12} md={6} lg={4} key={request._id}>
                    <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      {request.imageUrl && (
                        <CardMedia
                          component="img"
                          height="180"
                          image={request.imageUrl}
                          alt="Rescue animal"
                        />
                      )}
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Chip 
                            label={request.status.toUpperCase()} 
                            color={getStatusColor(request.status)} 
                            size="small"
                          />
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(request.created)}
                          </Typography>
                        </Box>
                        
                        <Typography variant="h6" gutterBottom>
                          {request.description}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationOnIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            {request.location}
                          </Typography>
                        </Box>
                        
                        {request.updates.length > 0 && (
                          <Paper elevation={0} sx={{ mt: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Latest Update:
                            </Typography>
                            <Typography variant="body2">
                              {request.updates[request.updates.length - 1].message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(request.updates[request.updates.length - 1].timestamp)}
                            </Typography>
                          </Paper>
                        )}
                      </CardContent>
                      
                      <CardActions sx={{ p: 2, pt: 0 }}>
                        <Button 
                          fullWidth
                          variant="outlined" 
                          color="primary"
                        >
                          View Details
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};

export default InformerDashboard; 