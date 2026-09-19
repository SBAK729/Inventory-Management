import { Badge } from '@/components/ui/badge';
import { isLowStock, type Item } from '@/types/item';

export function LowStockBadge({ item }: { item: Pick<Item, 'currentQuantity' | 'minQuantity'> }) {
  if (!isLowStock(item)) return null;

  return (
    <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
      Low Stock
    </Badge>
  );
}