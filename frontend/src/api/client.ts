import axios from 'axios';

// Get API URL from environment or default to local development
// In dev, use relative path to leverage Vite proxy (same origin = cookies work)
// In production, use full URL
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:8000/api');

// Create axios instance with credentials to send cookies
export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Required for session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// CSRF token handling
// Django sends CSRF token in cookie, we need to extract and send it in header
apiClient.interceptors.request.use(
  (config) => {
    // Get CSRF token from cookie
    const csrftoken = document.cookie
      .split('; ')
      .find((row) => row.startsWith('csrftoken='))
      ?.split('=')[1];

    if (csrftoken) {
      config.headers['X-CSRFToken'] = csrftoken;
    }

    // Debug: Log if sessionid cookie exists
    const sessionid = document.cookie
      .split('; ')
      .find((row) => row.startsWith('sessionid='));
    
    if (!sessionid && config.url?.includes('/auth/me')) {
      console.warn('⚠️ No sessionid cookie found when calling /auth/me');
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses globally (unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthenticated users (e.g., redirect to login)
      // This will be handled by router guards
    }
    return Promise.reject(error);
  }
);

