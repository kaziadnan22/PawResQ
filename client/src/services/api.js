import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to get the auth token
const getAuthToken = () => {
  // Check sessionStorage first (used by new auth system)
  let token = sessionStorage.getItem('pawresq_token');
  
  // Fallback to localStorage (for legacy support)
  if (!token) {
    token = localStorage.getItem('pawresq_token');
  }
  
  console.log('Auth token found:', token ? `${token.substring(0, 10)}...` : 'No token');
  return token;
};

// Add a request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    
    console.log(`Request to ${config.url}: token ${token ? 'found' : 'not found'}`);
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('Authorization header set:', `Bearer ${token.substring(0, 10)}...`);
    } else {
      console.warn('No authentication token found for request:', config.url);
      // Show a notification to the user if they're trying to access authenticated endpoints without a token
      if (config.url.includes('/statistics') || 
          config.url.includes('/profile') || 
          config.url.includes('/users')) {
        console.error('Attempting to access authenticated endpoint without token:', config.url);
      }
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}: status ${response.status}`);
    return response;
  },
  (error) => {
    // Get request URL if available
    const requestUrl = error.config ? error.config.url : 'unknown endpoint';
    
    console.error(`Error in request to ${requestUrl}:`, error.message);
    
    if (error.response) {
      console.error(`Server responded with status ${error.response.status}:`, 
                   error.response.data);
    }
    
    // Handle 401 Unauthorized errors (token expired or invalid)
    if (error.response && error.response.status === 401) {
      console.error('Authentication failed:', error.response.data);
      // Clear auth data from storage
      sessionStorage.removeItem('pawresq_token');
      sessionStorage.removeItem('pawresq_user');
      localStorage.removeItem('pawresq_token');
      localStorage.removeItem('pawresq_user');
      
      // Redirect to login only if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/users/register', userData),
  login: (credentials) => api.post('/users/login', credentials),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
  getUserStatistics: () => api.get('/users/statistics'),
};

// Users API
export const usersAPI = {
  getUsers: (params = {}) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  getUserStatistics: (id) => api.get(`/users/${id}/statistics`),
  updateUserRole: (id, roleData) => api.put(`/users/${id}/role`, roleData),
  initializeStatistics: () => api.post('/users/initialize-statistics'),
};

// Rescued Pets API
export const rescuedPetsAPI = {
  getRescuedPets: (filters = {}) => api.get('/rescued-pets', { params: filters }),
  getRescueStats: () => api.get('/rescued-pets/stats'),
  getRescuedPetById: (id) => api.get(`/rescued-pets/${id}`),
  createRescuedPet: (petData) => api.post('/rescued-pets', petData),
  updateRescuedPet: (id, petData) => api.put(`/rescued-pets/${id}`, petData),
  deleteRescuedPet: (id) => api.delete(`/rescued-pets/${id}`),
};

// Rescue Requests API
export const rescueRequestsAPI = {
  getRescueRequests: (filters = {}) => api.get('/rescue-requests', { params: filters }),
  getRescueRequestById: (id) => api.get(`/rescue-requests/${id}`),
  createRescueRequest: (requestData) => api.post('/rescue-requests', requestData),
  updateRescueRequest: (id, requestData) => api.put(`/rescue-requests/${id}`, requestData),
  deleteRescueRequest: (id) => api.delete(`/rescue-requests/${id}`),
  
  // Notifications
  getNotifications: () => api.get('/notifications'),
  getUnreadNotificationsCount: () => api.get('/notifications/unread/count'),
  markNotificationsAsRead: (notificationIds) => api.put('/notifications/mark-read', { notificationIds }),
  sendNotification: (notificationData) => api.post('/notifications', notificationData),
};

// Export the getAuthToken helper for use in other parts of the app
export { getAuthToken };

export default api; 