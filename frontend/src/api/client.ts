import axios from 'axios';

// In-memory CSRF token storage (fallback when cookie isn't available)
let csrfTokenCache: string | null = null;

// Export function to set CSRF token cache
export const setCsrfTokenCache = (token: string | null) => {
  csrfTokenCache = token;
  console.log('💾 CSRF token cached:', token ? 'stored' : 'cleared');
};

// Get API URL from environment or default to local development
// In dev, use relative path to leverage Vite proxy (same origin = cookies work)
// In production, use full URL
let API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:8000/api');

// Normalize API URL: ensure it ends with /api for production URLs
// This handles cases where VITE_API_URL is set without /api
if (API_URL.startsWith('http://') || API_URL.startsWith('https://')) {
  // Remove trailing slash if present
  API_URL = API_URL.replace(/\/$/, '');
  // Add /api if not already present
  if (!API_URL.endsWith('/api')) {
    API_URL = `${API_URL}/api`;
  }
}

// Debug: Log API URL in production
if (import.meta.env.PROD) {
  console.log('🔧 API_URL:', API_URL);
}

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
    // Debug: Log full URL being called
    const fullUrl = config.baseURL && config.url 
      ? `${config.baseURL}${config.url}` 
      : config.url;
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${fullUrl}`);
    
    // Get CSRF token from cookie first, then fallback to cache
    let csrftoken = document.cookie
      .split('; ')
      .find((row) => row.startsWith('csrftoken='))
      ?.split('=')[1];
    
    // Fallback to cached token if cookie not available (cross-origin cookie issues)
    if (!csrftoken && csrfTokenCache) {
      csrftoken = csrfTokenCache;
      console.log('📦 Using cached CSRF token');
    }

    if (csrftoken) {
      config.headers['X-CSRFToken'] = csrftoken;
      console.log(`✅ CSRF token added to ${config.method?.toUpperCase()} ${config.url}`);
    } else {
      console.warn(`⚠️ CSRF token not found for ${config.method?.toUpperCase()} ${config.url}`);
      console.warn('Available cookies:', document.cookie);
      console.warn('Cached token:', csrfTokenCache ? 'exists' : 'none');
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
    // Debug: Log error details
    if (error.response) {
      console.error(`❌ API Error: ${error.response.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      console.error('Response:', error.response.data);
      console.error('Full URL:', error.config?.baseURL + error.config?.url);
    } else if (error.request) {
      console.error('❌ API Request failed - no response received');
      console.error('Request URL:', error.config?.baseURL + error.config?.url);
    }
    
    if (error.response?.status === 401) {
      // Handle unauthenticated users (e.g., redirect to login)
      // This will be handled by router guards
    }
    return Promise.reject(error);
  }
);

