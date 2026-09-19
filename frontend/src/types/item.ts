export interface Item {
  id: number;
  code: string;
  name: string;
  category: string;
  unit: string;
  currentQuantity: number;
  minQuantity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Single source of truth for the low-stock rule — must match
// ItemsService.findAll()'s `currentQuantity <= minQuantity` exactly.
export function isLowStock(item: Pick<Item, 'currentQuantity' | 'minQuantity'>) {
  return item.currentQuantity <= item.minQuantity;
}