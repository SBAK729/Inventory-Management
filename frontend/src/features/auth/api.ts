import { apiClient } from '@/api/client';
import type { AuthUser } from '@/store/auth-store';

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export function login(email: string, password: string) {
  return apiClient
    .post<LoginResponse>('/auth/login', { email, password })
    .then((res) => res.data);
}

export function getMe() {
  return apiClient.get<AuthUser>('/auth/me').then((res) => res.data);
}

export function changePassword(currentPassword: string, newPassword: string) {
  return apiClient
    .post<{ message: string }>('/auth/change-password', { currentPassword, newPassword })
    .then((res) => res.data);
}

export function forgotPassword(email: string) {
  return apiClient
    .post<{ message: string }>('/auth/forgot-password', { email })
    .then((res) => res.data);
}

export function resetPassword(token: string, newPassword: string) {
  return apiClient
    .post<{ message: string }>('/auth/reset-password', { token, newPassword })
    .then((res) => res.data);
}