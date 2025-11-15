export interface User {
  id: number;
  username: string;
  email?: string;
  role: 'Admin' | 'Manager' | 'Member';
  is_active: boolean;
}

