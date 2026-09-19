import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { getItems } from '@/features/items/api';
import type { Item } from '@/types/item';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';

export function ReportsPage() {
  const { data: lowStockItems = [], isLoading } = useQuery({
    queryKey: ['items', '', true],
    queryFn: () => getItems({ lowStockOnly: true }),
  });

  const columns: ColumnDef<Item>[] = [
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'category', header: 'Category' },
    {
      id: 'quantity',
      header: 'Current / Min',
      cell: ({ row }) => (
        <span>
          {row.original.currentQuantity} / {row.original.minQuantity} {row.original.unit}
        </span>
      ),
    },
    {
      id: 'severity',
      header: 'Status',
      cell: ({ row }) =>
        row.original.currentQuantity === 0 ? (
          <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">
            Out of Stock
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
            Low Stock
          </Badge>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Low Stock Report"
        description="Items at or below their minimum quantity threshold."
      />
      <DataTable
        columns={columns}
        data={lowStockItems}
        isLoading={isLoading}
        emptyMessage="Nothing is low on stock right now."
      />
    </div>
  );
}