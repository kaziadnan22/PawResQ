import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    // First try sessionStorage (for current session)
    let token = sessionStorage.getItem('pawresq_token');
    let storedUser = sessionStorage.getItem('pawresq_user');
    
    // Fallback to localStorage (for persistent login)
    if (!token || !storedUser) {
      token = localStorage.getItem('pawresq_token');
      storedUser = localStorage.getItem('pawresq_user');
    }
    
    if (token && storedUser) {
      try {
        // Verify the token is valid JSON
        const userObj = JSON.parse(storedUser);
        setCurrentUser(userObj);
        
        // Sync the token between storage mechanisms
        sessionStorage.setItem('pawresq_token', token);
        sessionStorage.setItem('pawresq_user', storedUser);
        localStorage.setItem('pawresq_token', token);
        localStorage.setItem('pawresq_user', storedUser);
      } catch (e) {
        console.error('Error parsing stored user data', e);
        // Clear invalid data
        sessionStorage.removeItem('pawresq_token');
        sessionStorage.removeItem('pawresq_user');
        localStorage.removeItem('pawresq_token');
        localStorage.removeItem('pawresq_user');
      }
    }
    setLoading(false);

    // Add event listeners for page unload/tab close to clear auth state
    const handleTabClose = () => {
      logout();
    };

    window.addEventListener('beforeunload', handleTabClose);
    
    return () => {
      window.removeEventListener('beforeunload', handleTabClose);
    };
  }, []);

  const login = async (username, password) => {
    try {
      setLoading(true);
      const response = await authAPI.login({ username, password });
      const user = response.data;
      
      // Store in both sessionStorage and localStorage
      sessionStorage.setItem('pawresq_token', user.token);
      sessionStorage.setItem('pawresq_user', JSON.stringify(user));
      localStorage.setItem('pawresq_token', user.token);
      localStorage.setItem('pawresq_user', JSON.stringify(user));
      
      setCurrentUser(user);
      return user;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authAPI.register(userData);
      const user = response.data;
      
      // Store in both sessionStorage and localStorage
      sessionStorage.setItem('pawresq_token', user.token);
      sessionStorage.setItem('pawresq_user', JSON.stringify(user));
      localStorage.setItem('pawresq_token', user.token);
      localStorage.setItem('pawresq_user', JSON.stringify(user));
      
      setCurrentUser(user);
      return user;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('pawresq_token');
    sessionStorage.removeItem('pawresq_user');
    localStorage.removeItem('pawresq_token');
    localStorage.removeItem('pawresq_user');
    setCurrentUser(null);
  };

  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      const response = await authAPI.updateProfile(userData);
      const updatedUser = response.data;
      
      // Update in both storages
      sessionStorage.setItem('pawresq_user', JSON.stringify(updatedUser));
      localStorage.setItem('pawresq_user', JSON.stringify(updatedUser));
      
      setCurrentUser(updatedUser);
      
      toast.success('Profile updated successfully');
      return updatedUser;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile. Please try again.';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 