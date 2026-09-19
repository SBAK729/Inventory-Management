import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { getItems, deactivateItem } from './api';
import { ItemFormDialog } from './ItemFormDialog';
import { getErrorMessage } from '@/lib/api-error';
import { isLowStock, type Item } from '@/types/item';
import { useSearchParams } from 'react-router-dom';
import { LowStockBadge } from '@/components/low-stock-badge';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth-store';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

export function ItemsPage() {
  const queryClient = useQueryClient();
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === 'ADMIN';

  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(searchParams.get('lowStock') === 'true');
  // ...rest unchanged
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deactivatingItem, setDeactivatingItem] = useState<Item | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items', search, lowStockOnly],
    queryFn: () => getItems({ search, lowStockOnly }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => deactivateItem(id),
    onSuccess: () => {
      toast.success('Item deactivated.');
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setDeactivatingItem(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
      setDeactivatingItem(null);
    },
  });

  const columns: ColumnDef<Item>[] = [
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'category', header: 'Category' },
    {
      id: 'quantity',
      header: 'Quantity',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span>
            {row.original.currentQuantity} {row.original.unit}
          </span>
          <LowStockBadge item={row.original} />
        </div>
      ),
    },
    { accessorKey: 'minQuantity', header: 'Min. Qty' },
    ...(canManage
      ? [
          {
            id: 'actions',
            header: '',
            cell: ({ row }: { row: { original: Item } }) => (
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingItem(row.original);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeactivatingItem(row.original);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ),
          } satisfies ColumnDef<Item>,
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Items"
        description="Manage inventory items and stock thresholds."
        action={
          canManage && (
            <Button
              onClick={() => {
                setEditingItem(null);
                setFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          )
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by code or name..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant={lowStockOnly ? 'default' : 'outline'}
          onClick={() => setLowStockOnly((v) => !v)}
        >
          Low Stock Only
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        emptyMessage="No items found."
      />

      {canManage && (
        <>
          <ItemFormDialog open={formOpen} onOpenChange={setFormOpen} item={editingItem} />

          <ConfirmDialog
            open={!!deactivatingItem}
            onOpenChange={(open) => !open && setDeactivatingItem(null)}
            title="Deactivate item?"
            description={`"${deactivatingItem?.name}" will be hidden from active lists, but its history in past purchase requests and stock transactions is preserved.`}
            confirmLabel="Deactivate"
            destructive
            isLoading={deactivateMutation.isPending}
            onConfirm={() =>
              deactivatingItem && deactivateMutation.mutate(deactivatingItem.id)
            }
          />
        </>
      )}
    </div>
  );
}