import { apiClient } from './client';
import type { User } from './types';

export type { User };

export interface AuthMeResponse {
  user: User | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  message: string;
}

export interface LogoutResponse {
  message: string;
}

/**
 * Get CSRF token from Django
 * Uses dedicated CSRF token endpoint to ensure cookie is set properly
 */
export const getCsrfToken = async (): Promise<string | null> => {
  try {
    // Use dedicated CSRF token endpoint
    const response = await apiClient.get<{ csrfToken: string }>('/auth/csrf-token/');
    
    // Extract CSRF token from cookie (Django also sets it in cookie)
    const csrftoken = document.cookie
      .split('; ')
      .find((row) => row.startsWith('csrftoken='))
      ?.split('=')[1];
    
    return csrftoken || response.data.csrfToken || null;
  } catch (error) {
    console.error('Error getting CSRF token:', error);
    return null;
  }
};

/**
 * Login with username and password
 * Creates a session and returns user data
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  // Ensure CSRF token is available
  await getCsrfToken();
  
  const response = await apiClient.post<LoginResponse>('/auth/login/', credentials);
  return response.data;
};

/**
 * Logout current user
 * Destroys the session
 */
export const logout = async (): Promise<LogoutResponse> => {
  // Ensure CSRF token is available before logout
  await getCsrfToken();
  
  const response = await apiClient.post<LogoutResponse>('/auth/logout/');
  return response.data;
};

/**
 * Get current authenticated user
 * Returns 401 if not authenticated
 */
export const authMe = async (): Promise<AuthMeResponse> => {
  try {
    const response = await apiClient.get<AuthMeResponse>('/auth/me/');
    return response.data;
  } catch (error: any) {
    // Log error for debugging
    if (error?.response?.status === 401) {
      console.warn('⚠️ /auth/me returned 401 - session may have expired or cookie not sent');
      // Check if cookie exists
      const hasSessionCookie = document.cookie.includes('sessionid=');
      if (hasSessionCookie) {
        console.warn('⚠️ Session cookie exists but request returned 401 - cookie may not be forwarded by proxy');
      }
    }
    throw error;
  }
};
