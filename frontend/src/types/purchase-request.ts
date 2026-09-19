import type { Role } from '@/store/auth-store';

export type RequestStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'FULFILLED';

export interface PersonSummary {
  id: number;
  fullName: string;
  email: string;
}

export interface DepartmentSummary {
  id: number;
  name: string;
}

export interface LineItemDetail {
  id: number;
  itemId: number;
  requestedQuantity: number;
  issuedQuantity: number;
  item: {
    id: number;
    code: string;
    name: string;
    unit: string;
  };
}

export interface PurchaseRequest {
  id: number;
  requestNumber: string;
  purpose: string;
  status: RequestStatus;
  rejectionReason: string | null;
  requestDate: string;
  decidedAt: string | null;
  requesterId: number;
  requester: PersonSummary;
  departmentId: number;
  department: DepartmentSummary;
  approverId: number | null;
  approver: PersonSummary | null;
  lineItems: LineItemDetail[];
  createdAt: string;
  updatedAt: string;
}

export const EDITABLE_ROLES: Role[] = ['EMPLOYEE', 'MANAGER'];