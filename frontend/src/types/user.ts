import type { Role } from '@/store/auth-store';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  departmentId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}