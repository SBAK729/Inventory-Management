import { apiClient } from '@/api/client';
import type { Item } from '@/types/item';

export interface ItemsQuery {
  search?: string;
  category?: string;
  lowStockOnly?: boolean;
}

export interface CreateItemValues {
  code: string;
  name: string;
  category: string;
  unit: string;
  currentQuantity?: number;
  minQuantity: number;
}

export interface UpdateItemValues {
  name?: string;
  category?: string;
  unit?: string;
  minQuantity?: number;
}

export function getItems(query: ItemsQuery = {}) {
  return apiClient
    .get<Item[]>('/items', {
      params: {
        search: query.search || undefined,
        category: query.category || undefined,
        lowStockOnly: query.lowStockOnly ? 'true' : undefined,
      },
    })
    .then((res) => res.data);
}

export function createItem(dto: CreateItemValues) {
  return apiClient.post<Item>('/items', dto).then((res) => res.data);
}

export function updateItem(id: number, dto: UpdateItemValues) {
  return apiClient.patch<Item>(`/items/${id}`, dto).then((res) => res.data);
}

export function deactivateItem(id: number) {
  return apiClient.delete<Item>(`/items/${id}`).then((res) => res.data);
}