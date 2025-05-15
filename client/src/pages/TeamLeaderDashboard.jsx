import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Divider,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Badge,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Tab,
  Tabs,
  ListSubheader
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import PetsIcon from '@mui/icons-material/Pets';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../context/AuthContext';
import { rescueRequestsAPI, usersAPI } from '../services/api';
import { toast } from 'react-toastify';

const TeamLeaderDashboard = () => {
  const { currentUser } = useAuth();
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState({ requests: true, volunteers: true });
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchApprovedRequests();
    fetchVolunteers();
    fetchNotifications();
  }, []);

  const fetchApprovedRequests = async () => {
    try {
      setLoading(prev => ({ ...prev, requests: true }));
      const response = await rescueRequestsAPI.getRescueRequests({ status: 'approved' });
      setApprovedRequests(response.data);
    } catch (err) {
      console.error('Error fetching approved requests:', err);
      setError('Failed to load approved requests. Please try again.');
      // Mock data for demo
      setApprovedRequests([
        {
          _id: '1',
          informer: { _id: '101', name: 'John Doe' },
          description: 'Injured dog found on the street',
          location: '123 Main St, Cityville',
          coordinates: { lat: 40.7128, lng: -74.0060 },
          imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          status: 'approved',
          created: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        },
        {
          _id: '2',
          informer: { _id: '102', name: 'Jane Smith' },
          description: 'Cat trapped in drainage pipe',
          location: '456 Park Ave, Townsburg',
          coordinates: { lat: 34.0522, lng: -118.2437 },
          imageUrl: 'https://images.unsplash.com/photo-1548681528-6a5c45b66b42?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          status: 'approved',
          created: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        }
      ]);
    } finally {
      setLoading(prev => ({ ...prev, requests: false }));
    }
  };

  const fetchVolunteers = async () => {
    try {
      setLoading(prev => ({ ...prev, volunteers: true }));
      const response = await usersAPI.getUsers({ role: 'volunteer', isActive: true });
      
      // Sort volunteers by area for better UX
      const sortedVolunteers = response.data.sort((a, b) => {
        // Sort by area, putting volunteers with areas first
        if (a.area && !b.area) return -1;
        if (!a.area && b.area) return 1;
        if (a.area && b.area) return a.area.localeCompare(b.area);
        return a.name.localeCompare(b.name); // Fall back to sorting by name
      });
      
      setVolunteers(sortedVolunteers);
      
      if (sortedVolunteers.length === 0) {
        toast.info('No active volunteers available for assignment');
      }
    } catch (err) {
      console.error('Error fetching volunteers:', err);
      toast.error('Failed to load volunteers. Please try again.');
      // Set empty array instead of mock data
      setVolunteers([]);
    } finally {
      setLoading(prev => ({ ...prev, volunteers: false }));
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await rescueRequestsAPI.getNotifications();
      setNotifications(response.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      // Mock data for demo
      setNotifications([
        {
          _id: 'n1',
          type: 'NEW_RESCUE_APPROVED',
          content: 'New rescue request approved: Injured dog found on the street',
          rescueRequestId: '1',
          isRead: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        },
        {
          _id: 'n2',
          type: 'NEW_RESCUE_APPROVED',
          content: 'New rescue request approved: Cat trapped in drainage pipe',
          rescueRequestId: '2',
          isRead: false,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
        }
      ]);
    }
  };

  const handleOpenAssignDialog = (request) => {
    setSelectedRequest(request);
    setAssignDialogOpen(true);
  };

  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
    setSelectedRequest(null);
    setSelectedVolunteer('');
  };

  const handleAssignVolunteer = async () => {
    if (!selectedVolunteer) {
      toast.error('Please select a volunteer');
      return;
    }

    try {
      await rescueRequestsAPI.updateRescueRequest(selectedRequest._id, {
        status: 'assigned',
        assignedTo: selectedVolunteer,
        updates: [{ message: `Assigned to volunteer ID: ${selectedVolunteer}` }]
      });

      // Notify the assigned volunteer
      await rescueRequestsAPI.sendNotification({
        type: 'RESCUE_ASSIGNED',
        targetId: selectedVolunteer,
        content: `You've been assigned to rescue: ${selectedRequest.description}`,
        rescueRequestId: selectedRequest._id
      });

      toast.success('Volunteer assigned successfully');
      
      // Update the local state to reflect the change
      setApprovedRequests(approvedRequests.filter(req => req._id !== selectedRequest._id));
      
      handleCloseAssignDialog();
    } catch (err) {
      console.error('Error assigning volunteer:', err);
      toast.error('Failed to assign volunteer. Please try again.');
    }
  };

  const handleOpenNotificationDialog = () => {
    setNotificationDialogOpen(true);
  };

  const handleCloseNotificationDialog = () => {
    setNotificationDialogOpen(false);
    // Mark notifications as read
    markNotificationsAsRead();
  };

  const markNotificationsAsRead = async () => {
    try {
      await rescueRequestsAPI.markNotificationsAsRead();
      // Update local state
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Check if user has the correct role
  if (currentUser && currentUser.role !== 'teamLeader') {
    return (
      <Container maxWidth="md" sx={{ mt: 5 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" color="error" gutterBottom>
            Unauthorized Access
          </Typography>
          <Typography variant="body1">
            You do not have permission to access the Team Leader Dashboard.
          </Typography>
        </Paper>
      </Container>
    );
  }

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Team Leader Dashboard</Typography>
        <IconButton color="primary" onClick={handleOpenNotificationDialog}>
          <Badge badgeContent={unreadNotificationsCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Box>

      <Paper elevation={3} sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Approved Requests" icon={<AssignmentIcon />} />
          <Tab label="Team Members" icon={<PersonIcon />} />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Approved Rescue Requests
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="body1" paragraph>
            Assign volunteers to approved rescue requests.
          </Typography>

          {loading.requests ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
          ) : approvedRequests.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>No approved rescue requests waiting for assignment.</Alert>
          ) : (
            <Grid container spacing={3}>
              {approvedRequests.map((request) => (
                <Grid item xs={12} md={6} lg={4} key={request._id}>
                  <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-5px)' } }}>
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
                          color={request.status === 'approved' ? 'info' : 'success'} 
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
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Reported by: {request.informer.name}
                        </Typography>
                      </Box>
                    </CardContent>
                    
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button 
                        fullWidth
                        variant="contained" 
                        color="primary" 
                        startIcon={<AssignmentIcon />}
                        onClick={() => handleOpenAssignDialog(request)}
                      >
                        Assign Volunteer
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      )}

      {tabValue === 1 && (
        <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Team Members
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {loading.volunteers ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : volunteers.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>No active volunteers available.</Alert>
          ) : (
            <Grid container spacing={3}>
              {volunteers.map((volunteer) => (
                <Grid item xs={12} sm={6} md={4} key={volunteer._id}>
                  <Card elevation={2} sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          {volunteer.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6">{volunteer.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Area: {volunteer.area || 'Not specified'}
                          </Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <Chip 
                          label="Active" 
                          color="success" 
                          size="small" 
                          icon={<CheckCircleIcon />} 
                        />
                        <Button 
                          variant="outlined" 
                          size="small"
                        >
                          View Details
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      )}

      {/* Assign Volunteer Dialog */}
      <Dialog open={assignDialogOpen} onClose={handleCloseAssignDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Volunteer to Rescue Request</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <>
              <DialogContentText>
                Please select a volunteer to assign to the following rescue request:
              </DialogContentText>
              
              <Box sx={{ mt: 2, mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="subtitle1">{selectedRequest.description}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Location: {selectedRequest.location}
                </Typography>
              </Box>
              
              {volunteers.length === 0 ? (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  No active volunteers available. Please try again later or add volunteers to your team.
                </Alert>
              ) : (
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel id="volunteer-select-label">Select Volunteer</InputLabel>
                  <Select
                    labelId="volunteer-select-label"
                    id="volunteer-select"
                    value={selectedVolunteer}
                    label="Select Volunteer"
                    onChange={(e) => setSelectedVolunteer(e.target.value)}
                  >
                    {/* Group volunteers by area for better organization */}
                    {Array.from(new Set(volunteers.filter(v => v.area).map(v => v.area))).map(area => [
                      <ListSubheader key={`area-${area}`}>
                        {area}
                      </ListSubheader>,
                      volunteers
                        .filter(volunteer => volunteer.area === area)
                        .map(volunteer => (
                          <MenuItem key={volunteer._id} value={volunteer._id}>
                            {volunteer.name}
                          </MenuItem>
                        ))
                    ])}
                    
                    {/* Add volunteers without an area at the end */}
                    {volunteers.filter(v => !v.area).length > 0 && [
                      <ListSubheader key="area-none">
                        No Area Assigned
                      </ListSubheader>,
                      volunteers
                        .filter(volunteer => !volunteer.area)
                        .map(volunteer => (
                          <MenuItem key={volunteer._id} value={volunteer._id}>
                            {volunteer.name}
                          </MenuItem>
                        ))
                    ]}
                  </Select>
                </FormControl>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleAssignVolunteer} 
            color="primary" 
            variant="contained"
            disabled={volunteers.length === 0 || !selectedVolunteer}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog 
        open={notificationDialogOpen} 
        onClose={handleCloseNotificationDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <NotificationsIcon sx={{ mr: 2 }} />
            Notifications
          </Box>
        </DialogTitle>
        <DialogContent>
          {notifications.length === 0 ? (
            <Typography align="center" sx={{ py: 4 }}>No notifications</Typography>
          ) : (
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {notifications.map((notification) => (
                <ListItem 
                  key={notification._id}
                  alignItems="flex-start"
                  sx={{ 
                    mb: 1, 
                    bgcolor: notification.isRead ? 'transparent' : 'rgba(0, 0, 0, 0.04)',
                    borderRadius: 1 
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <PetsIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={notification.content}
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          {formatDate(notification.createdAt)}
                        </Typography>
                        {!notification.isRead && (
                          <Chip 
                            label="New" 
                            color="primary" 
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNotificationDialog} color="primary">
            Mark All as Read
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeamLeaderDashboard; 