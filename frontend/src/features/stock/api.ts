import { apiClient } from '@/api/client';
import type { Item } from '@/types/item';

interface StockTransactionResult {
  transaction: {
    id: number;
    type: 'RECEIPT' | 'ISSUE';
    quantity: number;
    itemId: number;
    purchaseRequestId: number | null;
  };
  item: Item;
}

export function recordReceipt(itemCode: string, quantity: number) {
  return apiClient
    .post<StockTransactionResult>('/stock/receipts', { itemCode, quantity })
    .then((res) => res.data);
}

export function issueStock(itemCode: string, quantity: number, purchaseRequestId?: number) {
  return apiClient
    .post<StockTransactionResult>('/stock/issues', { itemCode, quantity, purchaseRequestId })
    .then((res) => res.data);
}