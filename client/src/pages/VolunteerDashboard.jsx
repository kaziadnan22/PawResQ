import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Button,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Badge,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField
} from '@mui/material';
import PetsIcon from '@mui/icons-material/Pets';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../context/AuthContext';
import { rescueRequestsAPI } from '../services/api';
import { toast } from 'react-toastify';

const VolunteerDashboard = () => {
  const { currentUser } = useAuth();
  const [assignedRequests, setAssignedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [updateNote, setUpdateNote] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);

  useEffect(() => {
    fetchAssignedRequests();
    fetchNotifications();
  }, []);

  const fetchAssignedRequests = async () => {
    try {
      setLoading(true);
      const response = await rescueRequestsAPI.getRescueRequests({ 
        assignedTo: currentUser._id,
        status: ['assigned', 'rescued'] 
      });
      setAssignedRequests(response.data);
    } catch (err) {
      console.error('Error fetching assigned requests:', err);
      setError('Failed to load assigned requests. Please try again.');
      // Mock data for demo
      setAssignedRequests([
        {
          _id: '1',
          informer: { _id: '101', name: 'John Doe' },
          description: 'Injured dog found on the street',
          location: '123 Main St, Cityville',
          coordinates: { lat: 40.7128, lng: -74.0060 },
          imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          status: 'assigned',
          created: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          updates: [
            { message: 'Request approved by checker', timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000) },
            { message: 'Assigned to volunteer', timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000) }
          ]
        },
        {
          _id: '2',
          informer: { _id: '102', name: 'Jane Smith' },
          description: 'Cat trapped in drainage pipe',
          location: '456 Park Ave, Townsburg',
          coordinates: { lat: 34.0522, lng: -118.2437 },
          imageUrl: 'https://images.unsplash.com/photo-1548681528-6a5c45b66b42?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          status: 'rescued',
          created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          updates: [
            { message: 'Request approved by checker', timestamp: new Date(Date.now() - 2.8 * 24 * 60 * 60 * 1000) },
            { message: 'Assigned to volunteer', timestamp: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000) },
            { message: 'On my way to the location', timestamp: new Date(Date.now() - 2.2 * 24 * 60 * 60 * 1000) },
            { message: 'Animal rescued successfully', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await rescueRequestsAPI.getNotifications();
      setNotifications(response.data.filter(n => n.targetId === currentUser._id));
    } catch (err) {
      console.error('Error fetching notifications:', err);
      // Mock data for demo
      setNotifications([
        {
          _id: 'n1',
          type: 'RESCUE_ASSIGNED',
          content: 'You\'ve been assigned to rescue: Injured dog found on the street',
          rescueRequestId: '1',
          isRead: false,
          createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000) // 18 hours ago
        }
      ]);
    }
  };

  const handleOpenUpdateDialog = (request) => {
    setSelectedRequest(request);
    setUpdateDialogOpen(true);
  };

  const handleCloseUpdateDialog = () => {
    setUpdateDialogOpen(false);
    setSelectedRequest(null);
    setUpdateNote('');
  };

  const handleOpenStatusDialog = (request) => {
    setSelectedRequest(request);
    setStatusDialogOpen(true);
    
    // Set the correct next status based on the current status
    let nextStatus;
    switch(request.status) {
      case 'assigned':
        nextStatus = 'rescued';
        break;
      case 'in-progress':
        nextStatus = 'rescued';
        break;
      case 'rescued':
        nextStatus = 'completed';
        break;
      default:
        nextStatus = 'completed';
    }
    
    setNewStatus(nextStatus);
  };

  const handleCloseStatusDialog = () => {
    setStatusDialogOpen(false);
    setSelectedRequest(null);
    setNewStatus('');
  };

  const handleAddUpdate = async () => {
    if (!updateNote.trim()) {
      toast.error('Please enter an update note');
      return;
    }

    try {
      const updatedRequest = {
        ...selectedRequest,
        updates: [
          ...selectedRequest.updates,
          { message: updateNote, timestamp: new Date() }
        ]
      };

      await rescueRequestsAPI.updateRescueRequest(selectedRequest._id, updatedRequest);
      
      toast.success('Update added successfully');
      
      // Update local state
      setAssignedRequests(assignedRequests.map(req => 
        req._id === selectedRequest._id ? updatedRequest : req
      ));
      
      handleCloseUpdateDialog();
    } catch (err) {
      console.error('Error adding update:', err);
      toast.error('Failed to add update. Please try again.');
    }
  };

  const handleUpdateStatus = async () => {
    try {
      console.log(`Updating request ${selectedRequest._id} status from ${selectedRequest.status} to ${newStatus}`);
      
      const statusUpdate = {
        status: newStatus,
        updates: [
          ...selectedRequest.updates,
          { 
            message: `Status updated to ${newStatus}`, 
            timestamp: new Date() 
          }
        ]
      };

      // Add detailed logging for the request
      console.log('Sending update request with data:', JSON.stringify(statusUpdate));

      const response = await rescueRequestsAPI.updateRescueRequest(selectedRequest._id, statusUpdate);
      console.log('Update successful, server response:', response.data);
      
      toast.success(`Status updated to ${newStatus}`);
      
      // Update local state
      if (newStatus === 'completed') {
        setAssignedRequests(assignedRequests.filter(req => req._id !== selectedRequest._id));
      } else {
        setAssignedRequests(assignedRequests.map(req => 
          req._id === selectedRequest._id ? { ...req, ...statusUpdate } : req
        ));
      }
      
      handleCloseStatusDialog();
    } catch (err) {
      console.error('Error updating status:', err);
      
      // Provide more specific error messages
      if (err.response) {
        if (err.response.status === 403) {
          toast.error('You are not authorized to update this request status');
        } else if (err.response.status === 400) {
          toast.error(`Validation error: ${err.response.data.message}`);
        } else {
          toast.error(`Error: ${err.response.data.message || 'Unknown server error'}`);
        }
      } else if (err.request) {
        toast.error('No response from server. Please check your connection.');
      } else {
        toast.error('Failed to update status. Please try again.');
      }
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

  const getStatusColor = (status) => {
    const statusMap = {
      'assigned': 'primary',
      'in-progress': 'warning',
      'rescued': 'success',
      'completed': 'success'
    };
    return statusMap[status] || 'default';
  };

  const getStatusButtonText = (status) => {
    switch(status) {
      case 'assigned':
        return 'Mark as Rescued';
      case 'rescued':
        return 'Mark as Completed';
      case 'in-progress':
        return 'Mark as Rescued';
      default:
        return 'Update Status';
    }
  };

  const shouldShowStatusButton = (status) => {
    // Only show status button for these statuses
    return ['assigned', 'rescued', 'in-progress'].includes(status);
  };

  // Check if user has the correct role
  if (currentUser && currentUser.role !== 'volunteer') {
    return (
      <Container maxWidth="md" sx={{ mt: 5 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" color="error" gutterBottom>
            Unauthorized Access
          </Typography>
          <Typography variant="body1">
            You do not have permission to access the Volunteer Dashboard.
          </Typography>
        </Paper>
      </Container>
    );
  }

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Volunteer Dashboard</Typography>
        <IconButton color="primary" onClick={handleOpenNotificationDialog}>
          <Badge badgeContent={unreadNotificationsCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Box>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Assigned Rescue Requests
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Typography variant="body1" paragraph>
          View and manage your assigned rescue requests.
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        ) : assignedRequests.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>You have no assigned rescue requests at this time.</Alert>
        ) : (
          <Grid container spacing={3}>
            {assignedRequests.map((request) => (
              <Grid item xs={12} md={6} key={request._id}>
                <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {request.imageUrl && (
                    <CardMedia
                      component="img"
                      height="200"
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
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <LocationOnIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {request.location}
                      </Typography>
                    </Box>
                    
                    <Typography variant="subtitle2" gutterBottom>
                      Latest Updates:
                    </Typography>
                    <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                      {request.updates.slice(-3).map((update, index) => (
                        <ListItem key={index} sx={{ px: 2, py: 0.5 }}>
                          <ListItemText
                            primary={update.message}
                            secondary={formatDate(update.timestamp)}
                            primaryTypographyProps={{ variant: 'body2' }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                  
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button 
                      variant="outlined" 
                      color="primary"
                      onClick={() => handleOpenUpdateDialog(request)}
                      sx={{ mr: 1 }}
                    >
                      Add Update
                    </Button>
                    {shouldShowStatusButton(request.status) && (
                      <Button 
                        variant="contained" 
                        color={getStatusColor(request.status)}
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleOpenStatusDialog(request)}
                      >
                        {getStatusButtonText(request.status)}
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Add Update Dialog */}
      <Dialog open={updateDialogOpen} onClose={handleCloseUpdateDialog}>
        <DialogTitle>Add Update</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Provide an update on the rescue situation:
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="note"
            label="Update Note"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={updateNote}
            onChange={(e) => setUpdateNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUpdateDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAddUpdate} color="primary" variant="contained">
            Add Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusDialogOpen} onClose={handleCloseStatusDialog}>
        <DialogTitle>
          {selectedRequest?.status === 'assigned' ? 'Mark as Rescued' : 
           selectedRequest?.status === 'in-progress' ? 'Mark as Rescued' : 
           'Mark as Completed'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to change the status from <strong>{selectedRequest?.status}</strong> to <strong>{newStatus}</strong>?
          </DialogContentText>
          
          {selectedRequest?.status === 'assigned' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Use this when you have successfully rescued the animal and it's now in your care.
            </Typography>
          )}
          
          {selectedRequest?.status === 'in-progress' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Use this when you have successfully rescued the animal after working on the case.
            </Typography>
          )}
          
          {selectedRequest?.status === 'rescued' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Use this when the case is fully completed and no further action is needed.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateStatus} 
            color="success" 
            variant="contained"
            startIcon={<CheckCircleIcon />}
          >
            Confirm Status Change
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

export default VolunteerDashboard; 