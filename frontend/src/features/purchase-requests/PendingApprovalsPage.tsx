import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { getPendingApprovals } from './api';
import type { PurchaseRequest } from '@/types/purchase-request';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';

export function PendingApprovalsPage() {
  const navigate = useNavigate();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: getPendingApprovals,
  });

  const columns: ColumnDef<PurchaseRequest>[] = [
    { accessorKey: 'requestNumber', header: 'Request #' },
    {
      id: 'requester',
      header: 'Requester',
      cell: ({ row }) => row.original.requester.fullName,
    },
    { accessorKey: 'purpose', header: 'Purpose' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'requestDate',
      header: 'Submitted',
      cell: ({ row }) => new Date(row.original.requestDate).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Pending Approvals"
        description="Requests awaiting your decision."
      />

      <DataTable
        columns={columns}
        data={requests}
        isLoading={isLoading}
        emptyMessage="Nothing awaiting your approval right now."
        onRowClick={(row) => navigate(`/purchase-requests/${row.id}`)}
      />
    </div>
  );
}