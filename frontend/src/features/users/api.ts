import { apiClient } from '@/api/client';
import type { Role } from '@/store/auth-store';
import type { User } from '@/types/user';

export interface UserOption {
  id: number;
  fullName: string;
  role: Role;
}

export interface CreateUserValues {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  departmentId?: number;
}

export interface UpdateUserValues {
  fullName?: string;
  email?: string;
  password?: string;
  role?: Role;
  departmentId?: number;
  isActive?: boolean;
}

export function getUsers() {
  return apiClient.get<User[]>('/users').then((res) => res.data);
}

// Kept for the Department manager dropdown (Phase 4, Departments screen) —
// same endpoint, narrower type since that screen only needs id/name/role.
export function getUserOptions() {
  return apiClient.get<UserOption[]>('/users').then((res) => res.data);
}

export function createUser(dto: CreateUserValues) {
  return apiClient.post<User>('/users', dto).then((res) => res.data);
}

export function updateUser(id: number, dto: UpdateUserValues) {
  return apiClient.patch<User>(`/users/${id}`, dto).then((res) => res.data);
}

export function deactivateUser(id: number) {
  return apiClient.delete<User>(`/users/${id}`).then((res) => res.data);
}