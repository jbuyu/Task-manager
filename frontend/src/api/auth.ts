import { apiClient } from './client';

export interface User {
  id: number;
  username: string;
  email?: string;
  role: 'Admin' | 'Manager' | 'Member';
  is_active: boolean;
}

export interface AuthMeResponse {
  user: User | null;
}

/**
 * Get current authenticated user
 * Returns 401 if not authenticated
 */
export const authMe = async (): Promise<AuthMeResponse> => {
  const response = await apiClient.get<AuthMeResponse>('/auth/me/');
  return response.data;
};

