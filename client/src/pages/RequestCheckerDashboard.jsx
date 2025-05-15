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
  TextField,
  CircularProgress,
  Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../context/AuthContext';
import { rescueRequestsAPI } from '../services/api';
import { toast } from 'react-toastify';

const RequestCheckerDashboard = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    fetchRescueRequests();
  }, []);

  const fetchRescueRequests = async () => {
    try {
      setLoading(true);
      const response = await rescueRequestsAPI.getRescueRequests({ status: 'pending' });
      setRequests(response.data);
    } catch (err) {
      console.error('Error fetching rescue requests:', err);
      setError('Failed to load rescue requests. Please try again.');
      // For demo purposes, set mock data if API fails
      setRequests([
        {
          _id: '1',
          informer: { _id: '101', name: 'John Doe' },
          description: 'Injured dog found on the street',
          location: '123 Main St, Cityville',
          coordinates: { lat: 40.7128, lng: -74.0060 },
          imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          status: 'pending',
          created: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        },
        {
          _id: '2',
          informer: { _id: '102', name: 'Jane Smith' },
          description: 'Cat trapped in drainage pipe',
          location: '456 Park Ave, Townsburg',
          coordinates: { lat: 34.0522, lng: -118.2437 },
          imageUrl: 'https://images.unsplash.com/photo-1548681528-6a5c45b66b42?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          status: 'pending',
          created: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        },
        {
          _id: '3',
          informer: { _id: '103', name: 'Robert Johnson' },
          description: 'Three puppies abandoned in a box',
          location: '789 Elm St, Villagetown',
          coordinates: { lat: 37.7749, lng: -122.4194 },
          imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          status: 'pending',
          created: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (request, type) => {
    setSelectedRequest(request);
    setActionType(type);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedRequest(null);
    setRejectionReason('');
    setActionType('');
  };

  const handleApproveRequest = async () => {
    try {
      await rescueRequestsAPI.updateRescueRequest(selectedRequest._id, {
        status: 'approved',
        updates: [{ message: 'Request approved by checker' }]
      });
      
      // Send notification to team leaders
      await rescueRequestsAPI.sendNotification({
        type: 'NEW_RESCUE_APPROVED',
        targetRole: 'teamLeader',
        content: `New rescue request approved: ${selectedRequest.description}`,
        rescueRequestId: selectedRequest._id
      });
      
      toast.success('Request approved successfully');
      setRequests(requests.filter(req => req._id !== selectedRequest._id));
      handleCloseDialog();
    } catch (err) {
      console.error('Error approving request:', err);
      toast.error('Failed to approve request. Please try again.');
    }
  };

  const handleRejectRequest = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    try {
      await rescueRequestsAPI.updateRescueRequest(selectedRequest._id, {
        status: 'rejected',
        updates: [{ message: `Request rejected: ${rejectionReason}` }]
      });
      
      toast.success('Request rejected successfully');
      setRequests(requests.filter(req => req._id !== selectedRequest._id));
      handleCloseDialog();
    } catch (err) {
      console.error('Error rejecting request:', err);
      toast.error('Failed to reject request. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Check if user has the correct role
  if (currentUser && currentUser.role !== 'requestChecker') {
    return (
      <Container maxWidth="md" sx={{ mt: 5 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" color="error" gutterBottom>
            Unauthorized Access
          </Typography>
          <Typography variant="body1">
            You do not have permission to access the Request Checker Dashboard.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Request Checker Dashboard
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Typography variant="body1" paragraph>
          Review and manage rescue requests submitted by informers.
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        ) : requests.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>No pending rescue requests at this time.</Alert>
        ) : (
          <Grid container spacing={3}>
            {requests.map((request) => (
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
                        color={request.status === 'pending' ? 'warning' : 'success'} 
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
                      variant="contained" 
                      color="success" 
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleOpenDialog(request, 'approve')}
                      sx={{ mr: 1 }}
                    >
                      Approve
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="error" 
                      startIcon={<CancelIcon />}
                      onClick={() => handleOpenDialog(request, 'reject')}
                    >
                      Reject
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Approval/Rejection Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>
          {actionType === 'approve' ? 'Approve Rescue Request' : 'Reject Rescue Request'}
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <>
              <DialogContentText>
                {actionType === 'approve'
                  ? 'Are you sure you want to approve this rescue request? This will notify team leaders for volunteer assignment.'
                  : 'Please provide a reason for rejecting this rescue request:'}
              </DialogContentText>
              
              {actionType === 'reject' && (
                <TextField
                  autoFocus
                  margin="dense"
                  id="reason"
                  label="Reason for rejection"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  sx={{ mt: 2 }}
                />
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={actionType === 'approve' ? handleApproveRequest : handleRejectRequest} 
            color={actionType === 'approve' ? 'success' : 'error'}
            variant="contained"
          >
            {actionType === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RequestCheckerDashboard; 