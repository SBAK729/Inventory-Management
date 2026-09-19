import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { getApprovedAwaitingFulfillment } from '@/features/purchase-requests/api';
import { getItems } from '@/features/items/api';
import { StockActionDialog } from './StockActionDialog';
import type { PurchaseRequest } from '@/types/purchase-request';
import type { Item } from '@/types/item';
import { LowStockBadge } from '@/components/low-stock-badge';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

export function StockPage() {
  const navigate = useNavigate();
  const [dialogMode, setDialogMode] = useState<'receipt' | 'issue' | null>(null);

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['items', '', false],
    queryFn: () => getItems({}),
  });

  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['approved-awaiting-fulfillment'],
    queryFn: getApprovedAwaitingFulfillment,
  });

  const itemColumns: ColumnDef<Item>[] = [
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
  ];

  const requestColumns: ColumnDef<PurchaseRequest>[] = [
    { accessorKey: 'requestNumber', header: 'Request #' },
    {
      id: 'requester',
      header: 'Requester',
      cell: ({ row }) => row.original.requester.fullName,
    },
    {
      id: 'department',
      header: 'Department',
      cell: ({ row }) => row.original.department.name,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Stock"
        description="Current inventory levels and pending fulfillment."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDialogMode('receipt')}>
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Record Receipt
            </Button>
            <Button variant="outline" onClick={() => setDialogMode('issue')}>
              <ArrowUpFromLine className="mr-2 h-4 w-4" />
              Record Issue
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="levels">
        <TabsList>
          <TabsTrigger value="levels">Stock Levels</TabsTrigger>
          <TabsTrigger value="fulfillment">
            Fulfillment Queue
            {requests.length > 0 && (
              <span className="ml-2 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                {requests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="levels" className="mt-4">
          <DataTable
            columns={itemColumns}
            data={items}
            isLoading={itemsLoading}
            emptyMessage="No items found."
          />
        </TabsContent>

        <TabsContent value="fulfillment" className="mt-4">
          <DataTable
            columns={requestColumns}
            data={requests}
            isLoading={requestsLoading}
            emptyMessage="Nothing awaiting fulfillment right now."
            onRowClick={(row) => navigate(`/purchase-requests/${row.id}`)}
          />
        </TabsContent>
      </Tabs>

      <StockActionDialog
        open={dialogMode !== null}
        onOpenChange={(open) => !open && setDialogMode(null)}
        mode={dialogMode ?? 'receipt'}
      />
    </div>
  );
}