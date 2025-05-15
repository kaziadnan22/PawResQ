import { Container, Typography, Paper, Divider } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const SimpleDashboard = ({ title, role }) => {
  const { currentUser } = useAuth();

  // If the user's role doesn't match, show an unauthorized message
  if (currentUser && currentUser.role !== role) {
    return (
      <Container maxWidth="md" sx={{ mt: 5 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" color="error" gutterBottom>
            Unauthorized Access
          </Typography>
          <Typography variant="body1">
            You do not have permission to access the {title} Dashboard.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          {title} Dashboard
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body1" paragraph align="center">
          Welcome, {currentUser?.name}! You are logged in as a {role}.
        </Typography>
      </Paper>
    </Container>
  );
};

export default SimpleDashboard; 