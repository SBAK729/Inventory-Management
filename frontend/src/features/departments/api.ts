import { apiClient } from '@/api/client';
import type { Department } from '@/types/department';

export interface DepartmentFormValues {
  name: string;
  managerId?: number | null;
}

export function getDepartments() {
  return apiClient.get<Department[]>('/departments').then((res) => res.data);
}

export function createDepartment(dto: DepartmentFormValues) {
  return apiClient.post<Department>('/departments', dto).then((res) => res.data);
}

export function updateDepartment(id: number, dto: DepartmentFormValues) {
  return apiClient.patch<Department>(`/departments/${id}`, dto).then((res) => res.data);
}

export function deleteDepartment(id: number) {
  return apiClient.delete<void>(`/departments/${id}`).then((res) => res.data);
}