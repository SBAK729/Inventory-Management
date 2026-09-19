import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { getAllRequests } from './api';
import type { PurchaseRequest, RequestStatus } from '@/types/purchase-request';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const STATUS_OPTIONS: { value: RequestStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'FULFILLED', label: 'Fulfilled' },
];

export function AllRequestsPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<RequestStatus | 'ALL'>('ALL');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['all-requests', status],
    queryFn: () => getAllRequests(status === 'ALL' ? undefined : status),
  });

  const columns: ColumnDef<PurchaseRequest>[] = [
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
      <PageHeader title="All Purchase Requests" description="Every request in the system." />

      <div className="mb-4 max-w-xs">
        <Select value={status} onValueChange={(v) => setStatus(v as RequestStatus | 'ALL')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={requests}
        isLoading={isLoading}
        emptyMessage="No requests match this filter."
        onRowClick={(row) => navigate(`/purchase-requests/${row.id}`)}
      />
    </div>
  );
}