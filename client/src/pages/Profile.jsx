import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Divider,
  Button,
  TextField,
  CircularProgress,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PetsIcon from '@mui/icons-material/Pets';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import PendingIcon from '@mui/icons-material/Pending';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const Profile = () => {
  const { currentUser, updateProfile } = useAuth();
  const [userData, setUserData] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    area: '',
    profilePicture: ''
  });

  useEffect(() => {
    if (currentUser) {
      fetchUserData();
      fetchUserStatistics();
    }
  }, [currentUser]);

  const fetchUserData = async () => {
    try {
      const response = await authAPI.getProfile();
      setUserData(response.data);
      setFormData({
        name: response.data.name || '',
        email: response.data.email || '',
        area: response.data.area || '',
        profilePicture: response.data.profilePicture || ''
      });
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStatistics = async () => {
    try {
      console.log('Fetching user statistics...');
      const response = await authAPI.getUserStatistics();
      console.log('User statistics response:', response);
      
      if (response.data) {
        console.log('User statistics received:', response.data);
        setStatistics(response.data.statistics);
      } else {
        console.error('No data in statistics response');
        toast.error('Failed to load statistics data');
      }
    } catch (err) {
      console.error('Error fetching user statistics:', err);
      toast.error('Failed to load statistics. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateProfile(formData);
      setIsEditing(false);
      fetchUserData(); // Refresh user data
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !userData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const renderStatisticsForRole = () => {
    if (!statistics) {
      console.log('No statistics object found, showing empty state');
      fetchUserStatistics(); // Try to fetch in the background
      return (
        <Box sx={{ 
          py: 4,
          textAlign: 'center'
        }}>
          <Typography variant="body1" color="text.secondary">
            No statistics available
          </Typography>
        </Box>
      );
    }
    
    // Make sure statistics object has all the required fields
    console.log('Current statistics state:', statistics);
    
    // Create a safe stats object with proper fallbacks
    const stats = {
      saveCount: statistics?.saveCount || 0,
      helpCount: statistics?.helpCount || 0,
      requestsSubmitted: statistics?.requestsSubmitted || 0,
      requestsApproved: statistics?.requestsApproved || 0,
      requestsRejected: statistics?.requestsRejected || 0,
      pendingRequests: statistics?.pendingRequests || 0
    };
    
    console.log('Processed stats for rendering:', stats);

    switch (currentUser.role) {
      case 'volunteer':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={12}>
              <Card sx={{ height: '100%', bgcolor: 'success.light', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CheckCircleIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">Animals Saved</Typography>
                  </Box>
                  <Typography variant="h1" textAlign="center" sx={{ fontSize: '4rem' }}>
                    {stats.saveCount}
                  </Typography>
                  <Typography variant="body1" textAlign="center">
                    Total number of animals you have saved
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );
      case 'informer':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={12}>
              <Card sx={{ height: '100%', bgcolor: 'info.light', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PetsIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">Animals Helped</Typography>
                  </Box>
                  <Typography variant="h1" textAlign="center" sx={{ fontSize: '4rem' }}>
                    {stats.helpCount}
                  </Typography>
                  <Typography variant="body1" textAlign="center">
                    Total number of animals you have helped save
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );
      default:
        return (
          <Typography variant="body1" sx={{ p: 2 }}>
            No specific statistics available for your role.
          </Typography>
        );
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Grid container spacing={4}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar
                src={userData?.profilePicture || ''}
                alt={userData?.name}
                sx={{ width: 100, height: 100, mb: 2, bgcolor: 'primary.main' }}
              >
                {userData?.name?.charAt(0)}
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {userData?.name}
              </Typography>
              <Chip
                label={userData?.role?.toUpperCase()}
                color="primary"
                size="small"
                sx={{ textTransform: 'capitalize' }}
              />
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary="Username" secondary={userData?.username} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText primary="Email" secondary={userData?.email} />
              </ListItem>
              {userData?.area && (
                <ListItem>
                  <ListItemIcon>
                    <LocationOnIcon />
                  </ListItemIcon>
                  <ListItemText primary="Area" secondary={userData?.area} />
                </ListItem>
              )}
            </List>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setIsEditing(true)}
                sx={{ width: '100%' }}
              >
                Edit Profile
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Statistics and Edit Form */}
        <Grid item xs={12} md={8}>
          {isEditing ? (
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Edit Profile
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Box component="form" onSubmit={handleUpdate} noValidate>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      name="name"
                      label="Full Name"
                      value={formData.name}
                      onChange={handleInputChange}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="email"
                      label="Email Address"
                      value={formData.email}
                      onChange={handleInputChange}
                      fullWidth
                      required
                      type="email"
                    />
                  </Grid>
                  {currentUser.role === 'volunteer' && (
                    <Grid item xs={12}>
                      <TextField
                        name="area"
                        label="Area"
                        value={formData.area}
                        onChange={handleInputChange}
                        fullWidth
                        required
                      />
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <TextField
                      name="profilePicture"
                      label="Profile Picture URL"
                      value={formData.profilePicture}
                      onChange={handleInputChange}
                      fullWidth
                      helperText="Enter a URL for your profile picture"
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ display: 'flex', gap: 2 }}>
                    <Button 
                      variant="outlined" 
                      color="secondary" 
                      onClick={() => setIsEditing(false)}
                      sx={{ flex: 1 }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      variant="contained" 
                      color="primary"
                      disabled={loading}
                      sx={{ flex: 1 }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          ) : (
            <>
              <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h5">
                    Your Statistics
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                
                {renderStatisticsForRole()}
              </Paper>
              
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Account Information
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Typography variant="body1" paragraph>
                  <strong>Member Since:</strong> {new Date(userData?.createdAt).toLocaleDateString()}
                </Typography>
                <Typography variant="body1" paragraph>
                  <strong>Last Login:</strong> {new Date(userData?.lastLogin).toLocaleString()}
                </Typography>
                <Typography variant="body1" paragraph>
                  <strong>Account Status:</strong> {userData?.isActive ? 'Active' : 'Inactive'}
                </Typography>
              </Paper>
            </>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile; 