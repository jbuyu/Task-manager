import { apiClient } from './client';
import { User } from './auth';

/**
 * Get list of users (Admin only)
 */
export const getUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<User[]>('/users/');
  return response.data;
};

