import { apiClient } from '@/api/client';
import type { PurchaseRequest,RequestStatus } from '@/types/purchase-request';

export interface LineItemInput {
  itemCode: string;
  requestedQuantity: number;
}

export interface PurchaseRequestFormValues {
  purpose: string;
  lineItems: LineItemInput[];
}

export function getMyRequests() {
  return apiClient.get<PurchaseRequest[]>('/purchase-requests/mine').then((res) => res.data);
}

export function getPurchaseRequest(id: number) {
  return apiClient.get<PurchaseRequest>(`/purchase-requests/${id}`).then((res) => res.data);
}

export function createPurchaseRequest(dto: PurchaseRequestFormValues) {
  return apiClient.post<PurchaseRequest>('/purchase-requests', dto).then((res) => res.data);
}

export function updatePurchaseRequest(id: number, dto: Partial<PurchaseRequestFormValues>) {
  return apiClient.patch<PurchaseRequest>(`/purchase-requests/${id}`, dto).then((res) => res.data);
}

export function submitPurchaseRequest(id: number) {
  return apiClient.patch<PurchaseRequest>(`/purchase-requests/${id}/submit`, {}).then((res) => res.data);
}

export function cancelPurchaseRequest(id: number) {
  return apiClient
    .delete<{ deleted: boolean; id: number }>(`/purchase-requests/${id}`)
    .then((res) => res.data);
}
export function getPendingApprovals() {
  return apiClient.get<PurchaseRequest[]>('/purchase-requests/pending-approvals').then((res) => res.data);
}

export function approvePurchaseRequest(id: number) {
  return apiClient.patch<PurchaseRequest>(`/purchase-requests/${id}/approve`, {}).then((res) => res.data);
}

export function rejectPurchaseRequest(id: number, reason?: string) {
  return apiClient.patch<PurchaseRequest>(`/purchase-requests/${id}/reject`, { reason }).then((res) => res.data);
}

export function getApprovedAwaitingFulfillment() {
  return apiClient.get<PurchaseRequest[]>('/purchase-requests/approved').then((res) => res.data);
}

export function getAllRequests(status?: RequestStatus) {
  return apiClient
    .get<PurchaseRequest[]>('/purchase-requests', { params: { status } })
    .then((res) => res.data);
}