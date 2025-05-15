import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import theme from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import TeamLeaderDashboard from './pages/TeamLeaderDashboard';
import RequestCheckerDashboard from './pages/RequestCheckerDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import InformerDashboard from './pages/InformerDashboard';
import HomePage from './pages/HomePage';
import Profile from './pages/Profile';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Role-based dashboard router
const DashboardRouter = () => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  switch (currentUser.role) {
    case 'volunteer':
      return <VolunteerDashboard />;
    case 'teamLeader':
      return <TeamLeaderDashboard />;
    case 'requestChecker':
      return <RequestCheckerDashboard />;
    case 'receptionist':
      return <ReceptionistDashboard />;
    case 'informer':
      return <InformerDashboard />;
    case 'admin':
      return <Dashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

function AppContent() {
  const { currentUser } = useAuth();
  
  return (
    <>
      <Navbar />
      <Routes>
        <Route 
          path="/" 
          element={currentUser ? <ProtectedRoute><DashboardRouter /></ProtectedRoute> : <HomePage />} 
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        {/* Role-specific routes */}
        <Route path="/volunteer" element={<ProtectedRoute><VolunteerDashboard /></ProtectedRoute>} />
        <Route path="/team-leader" element={<ProtectedRoute><TeamLeaderDashboard /></ProtectedRoute>} />
        <Route path="/request-checker" element={<ProtectedRoute><RequestCheckerDashboard /></ProtectedRoute>} />
        <Route path="/receptionist" element={<ProtectedRoute><ReceptionistDashboard /></ProtectedRoute>} />
        <Route path="/informer" element={<ProtectedRoute><InformerDashboard /></ProtectedRoute>} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
