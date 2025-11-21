import { apiClient } from './client';
import type { PaginatedResponse, User } from './types';

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

export interface GetUsersParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

export type UserChoice = Pick<User, 'id' | 'username' | 'role' | 'is_active'>;

/**
 * Get list of users (Admin only)
 */
export const getUsers = async (params: GetUsersParams = {}): Promise<PaginatedResponse<User>> => {
  const response = await apiClient.get<PaginatedResponse<User>>('/users/', { params });
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

/**
 * Lightweight list of active users for task assignment (Admin/Manager)
 */
export const getUserChoices = async (): Promise<UserChoice[]> => {
  const response = await apiClient.get<UserChoice[]>('/users/choices/');
  return response.data;
};
