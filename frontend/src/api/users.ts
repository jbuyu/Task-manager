import { apiClient } from './client';
import type { User } from './types';

export interface UserCreateRequest {
  username: string;
  email?: string;
  password: string;
  role: 'Admin' | 'Manager' | 'Member';
  is_active?: boolean;
}

export interface UserUpdateRequest extends Partial<UserCreateRequest> {
  password?: string;
}

/**
 * Get list of users (Admin only)
 */
export const getUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<User[]>('/users/');
  return response.data;
};

/**
 * Get a single user by ID (Admin only)
 */
export const getUser = async (id: number): Promise<User> => {
  const response = await apiClient.get<User>(`/users/${id}/`);
  return response.data;
};

/**
 * Create a new user (Admin only)
 */
export const createUser = async (data: UserCreateRequest): Promise<User> => {
  const response = await apiClient.post<User>('/users/', data);
  return response.data;
};

/**
 * Update an existing user (Admin only)
 */
export const updateUser = async (id: number, data: UserUpdateRequest): Promise<User> => {
  const response = await apiClient.patch<User>(`/users/${id}/`, data);
  return response.data;
};

/**
 * Delete a user (Admin only)
 */
export const deleteUser = async (id: number): Promise<void> => {
  await apiClient.delete(`/users/${id}/`);
};
