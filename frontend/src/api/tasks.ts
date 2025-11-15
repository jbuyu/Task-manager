import { apiClient } from './client';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'Todo' | 'In Progress' | 'Done';
  deadline: string | null;
  assignee: number | null;
  assignee_username?: string;
  assignee_email?: string;
  assignee_role?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskCreateRequest {
  title: string;
  description?: string;
  status?: 'Todo' | 'In Progress' | 'Done';
  deadline?: string | null;
  assignee?: number | null;
}

export interface TaskUpdateRequest extends Partial<TaskCreateRequest> {}

export interface TaskListParams {
  status?: 'Todo' | 'In Progress' | 'Done';
  assignee?: number;
  search?: string;
  ordering?: string;
}

/**
 * Get list of tasks with optional filtering
 */
export const getTasks = async (params?: TaskListParams): Promise<Task[]> => {
  const response = await apiClient.get<Task[]>('/tasks/', { params });
  return response.data;
};

/**
 * Get a single task by ID
 */
export const getTask = async (id: number): Promise<Task> => {
  const response = await apiClient.get<Task>(`/tasks/${id}/`);
  return response.data;
};

/**
 * Create a new task
 */
export const createTask = async (data: TaskCreateRequest): Promise<Task> => {
  const response = await apiClient.post<Task>('/tasks/', data);
  return response.data;
};

/**
 * Update an existing task
 */
export const updateTask = async (id: number, data: TaskUpdateRequest): Promise<Task> => {
  const response = await apiClient.patch<Task>(`/tasks/${id}/`, data);
  return response.data;
};

/**
 * Delete a task
 */
export const deleteTask = async (id: number): Promise<void> => {
  await apiClient.delete(`/tasks/${id}/`);
};

