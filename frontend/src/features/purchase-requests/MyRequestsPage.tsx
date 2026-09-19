import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { getMyRequests } from './api';
import type { PurchaseRequest, RequestStatus } from '@/types/purchase-request';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { Plus, X } from 'lucide-react';

const STATUS_FILTER_LABELS: Record<string, string> = {
  DRAFT: 'Drafts',
  'SUBMITTED,APPROVED': 'In Progress',
  APPROVED: 'Approved',
  SUBMITTED: 'Submitted',
  REJECTED: 'Rejected',
  FULFILLED: 'Fulfilled',
};

export function MyRequestsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const role = useAuthStore((s) => s.user?.role);
  const canCreate = role === 'EMPLOYEE' || role === 'MANAGER';

  const statusParam = searchParams.get('status'); // e.g. "DRAFT" or "SUBMITTED,APPROVED"
  const statusFilter = statusParam ? (statusParam.split(',') as RequestStatus[]) : null;

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['my-requests'],
    queryFn: getMyRequests,
  });

  const filteredRequests = statusFilter
    ? requests.filter((r) => statusFilter.includes(r.status))
    : requests;

  const columns: ColumnDef<PurchaseRequest>[] = [
    { accessorKey: 'requestNumber', header: 'Request #' },
    { accessorKey: 'purpose', header: 'Purpose' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'requestDate',
      header: 'Date',
      cell: ({ row }) => new Date(row.original.requestDate).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <PageHeader
        title="My Purchase Requests"
        description="Requests you've created."
        action={
          canCreate && (
            <Button onClick={() => navigate('/purchase-requests/new')}>
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          )
        }
      />

      {statusParam && (
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          Filtered by: <span className="font-medium">{STATUS_FILTER_LABELS[statusParam] ?? statusParam}</span>
          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setSearchParams({})}>
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={filteredRequests}
        isLoading={isLoading}
        emptyMessage={statusParam ? 'No requests match this filter.' : 'No requests yet.'}
        onRowClick={(row) => navigate(`/purchase-requests/${row.id}`)}
      />
    </div>
  );
}