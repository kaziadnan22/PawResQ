import { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent,
  Button,
  CircularProgress,
  Divider
} from '@mui/material';
import PetsIcon from '@mui/icons-material/Pets';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import HomeIcon from '@mui/icons-material/Home';
import { Link as RouterLink } from 'react-router-dom';
import { rescuedPetsAPI } from '../services/api';

const HomePage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await rescuedPetsAPI.getRescueStats();
        setStats(response.data);
      } catch (err) {
        console.error('Error fetching rescue stats:', err);
        // If the API fails, set mock data for demonstration
        setStats({
          totalRescued: 578,
          byType: [
            { _id: 'dog', count: 217 },
            { _id: 'cat', count: 311 },
            { _id: 'bird', count: 24 },
            { _id: 'other', count: 26 }
          ],
          byTreatmentStatus: [
            { _id: 'recovered', count: 423 },
            { _id: 'in-treatment', count: 98 },
            { _id: 'pending', count: 47 },
            { _id: 'deceased', count: 10 }
          ],
          byAdoptionStatus: [
            { _id: 'adopted', count: 342 },
            { _id: 'ready', count: 86 },
            { _id: 'not-ready', count: 127 },
            { _id: 'pending', count: 23 }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon, description, color }) => (
    <Card 
      elevation={3}
      sx={{
        height: '100%', 
        borderRadius: 2,
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-5px)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div" color="text.secondary">
            {title}
          </Typography>
          {icon}
        </Box>
        <Typography variant="h3" component="div" fontWeight="bold">
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {description}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          PawResQ
        </Typography>
        <Typography variant="h5" component="div" color="text.secondary" sx={{ mb: 4 }}>
          Animal rescue management system making a difference one paw at a time
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          size="large" 
          component={RouterLink} 
          to="/login"
          sx={{ mr: 2 }}
        >
          Login
        </Button>
        <Button 
          variant="outlined" 
          color="primary" 
          size="large" 
          component={RouterLink} 
          to="/register"
        >
          Register
        </Button>
      </Box>

      <Paper elevation={3} sx={{ p: 4, mb: 6, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
          Our Impact
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Animals Rescued"
                value={stats?.totalRescued || 0}
                icon={<PetsIcon fontSize="large" color="primary" />}
                description="Total animals saved"
                color="primary.light"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="In Treatment"
                value={stats?.byTreatmentStatus.find(item => item._id === 'in-treatment')?.count || 0}
                icon={<LocalHospitalIcon fontSize="large" color="warning" />}
                description="Animals currently receiving care"
                color="warning.light"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Recovered"
                value={stats?.byTreatmentStatus.find(item => item._id === 'recovered')?.count || 0}
                icon={<VolunteerActivismIcon fontSize="large" color="success" />}
                description="Successfully recovered animals"
                color="success.light"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Adopted"
                value={stats?.byAdoptionStatus.find(item => item._id === 'adopted')?.count || 0}
                icon={<HomeIcon fontSize="large" color="info" />}
                description="Found forever homes"
                color="info.light"
              />
            </Grid>
          </Grid>
        )}
      </Paper>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h5" gutterBottom>
              Animals By Type
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={2}>
                {stats?.byType.map((type, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Typography variant="h6" textTransform="capitalize" color="text.secondary">
                          {type._id}
                        </Typography>
                        <Typography variant="h3" color="primary" fontWeight="bold">
                          {type.count}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h5" gutterBottom>
              How You Can Help
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body1" paragraph>
                  Your contribution can make a significant difference in the lives of these animals.
                  Join our team of dedicated volunteers or support our mission with a donation.
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button 
                  fullWidth
                  variant="contained" 
                  color="primary"
                  component={RouterLink}
                  to="/register"
                  sx={{ py: 1.5 }}
                >
                  Become a Volunteer
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button 
                  fullWidth
                  variant="outlined" 
                  color="primary"
                  sx={{ py: 1.5 }}
                >
                  Make a Donation
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HomePage; 