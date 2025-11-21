export interface User {
  id: number;
  username: string;
  email?: string;
  role: 'Admin' | 'Manager' | 'Member';
  is_active: boolean;
}

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

export interface PaginatedResponse<T> {
  count: number;
  current_page: number;
  total_pages: number;
  page_size: number;
  results: T[];
}
