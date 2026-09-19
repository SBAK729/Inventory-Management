export interface DepartmentManager {
  id: number;
  fullName: string;
  email: string;
}

export interface Department {
  id: number;
  name: string;
  managerId: number | null;
  manager: DepartmentManager | null;
  createdAt: string;
  updatedAt: string;
}