import { useState, useEffect } from 'react';
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import PetsIcon from '@mui/icons-material/Pets';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import HomeIcon from '@mui/icons-material/Home';
import { rescuedPetsAPI } from '../services/api';

const DashboardStats = () => {
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
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatStatCards = () => {
    if (!stats) return null;

    // Get treatment status counts
    const pendingCount = stats.byTreatmentStatus.find(item => item._id === 'pending')?.count || 0;
    const inTreatmentCount = stats.byTreatmentStatus.find(item => item._id === 'in-treatment')?.count || 0;
    const recoveredCount = stats.byTreatmentStatus.find(item => item._id === 'recovered')?.count || 0;
    
    // Get adoption status counts
    const adoptedCount = stats.byAdoptionStatus.find(item => item._id === 'adopted')?.count || 0;

    return [
      {
        title: 'Total Rescues',
        value: stats.totalRescued || 0,
        icon: <PetsIcon fontSize="large" color="primary" />,
        description: 'Total animals rescued',
        color: 'primary.light',
      },
      {
        title: 'In Treatment',
        value: inTreatmentCount,
        icon: <LocalHospitalIcon fontSize="large" color="warning" />,
        description: 'Animals currently receiving care',
        color: 'warning.light',
      },
      {
        title: 'Recovered',
        value: recoveredCount,
        icon: <VolunteerActivismIcon fontSize="large" color="success" />,
        description: 'Successfully recovered animals',
        color: 'success.light',
      },
      {
        title: 'Adopted',
        value: adoptedCount,
        icon: <HomeIcon fontSize="large" color="info" />,
        description: 'Found forever homes',
        color: 'info.light',
      },
    ];
  };

  const statCards = formatStatCards();

  return (
    <>
      {/* Stats Cards */}
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'medium' }}>
        Rescue Statistics
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {statCards && statCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                elevation={2}
                sx={{
                  height: '100%', 
                  borderRadius: 2,
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" component="div" color="text.secondary">
                      {card.title}
                    </Typography>
                    {card.icon}
                  </Box>
                  <Typography variant="h3" component="div" fontWeight="bold">
                    {card.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {card.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pet Type Distribution */}
      {stats && !loading && !error && (
        <>
          <Typography variant="h5" sx={{ mt: 6, mb: 3, fontWeight: 'medium' }}>
            Animal Types
          </Typography>
          <Grid container spacing={3}>
            {stats.byType && stats.byType.map((type, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card elevation={2} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" component="div" textTransform="capitalize" color="text.secondary">
                      {type._id}
                    </Typography>
                    <Typography variant="h4" color="primary" fontWeight="bold">
                      {type.count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {type.count === 1 ? 'animal' : 'animals'} rescued
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </>
  );
};

export default DashboardStats; 