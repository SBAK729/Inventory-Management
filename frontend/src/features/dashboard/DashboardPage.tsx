import { useQuery } from '@tanstack/react-query';
import { getMyRequests, getPendingApprovals, getApprovedAwaitingFulfillment } from '@/features/purchase-requests/api';
import { getItems } from '@/features/items/api';
import { getUsers } from '@/features/users/api';
import { getDepartments } from '@/features/departments/api';
import { useAuthStore } from '@/store/auth-store';
import { StatCard } from '@/components/stat-card';
import { PageHeader } from '@/components/page-header';
import {
  FileText,
  Clock,
  CheckSquare,
  PackageCheck,
  AlertTriangle,
  Users,
  Building2,
  Package,
} from 'lucide-react';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  const canSeeOwnRequests = role === 'EMPLOYEE' || role === 'MANAGER';
  const isManager = role === 'MANAGER';
  const isStorekeeper = role === 'STOREKEEPER';
  const isAdmin = role === 'ADMIN';

  const { data: myRequests = [] } = useQuery({
    queryKey: ['my-requests'],
    queryFn: getMyRequests,
    enabled: canSeeOwnRequests,
  });

  const { data: pendingApprovals = [] } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: getPendingApprovals,
    enabled: isManager,
  });

  const { data: awaitingFulfillment = [] } = useQuery({
    queryKey: ['approved-awaiting-fulfillment'],
    queryFn: getApprovedAwaitingFulfillment,
    enabled: isStorekeeper || isAdmin,
  });

  const { data: lowStockItems = [] } = useQuery({
    queryKey: ['items', '', true],
    queryFn: () => getItems({ lowStockOnly: true }),
    enabled: isStorekeeper || isAdmin,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    enabled: isAdmin,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
    enabled: isAdmin,
  });

  const draftCount = myRequests.filter((r) => r.status === 'DRAFT').length;
  const inProgressCount = myRequests.filter(
    (r) => r.status === 'SUBMITTED' || r.status === 'APPROVED',
  ).length;

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.fullName?.split(' ')[0]}`}
        description="Here's what's happening right now."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {canSeeOwnRequests && (
          <>
            <StatCard
              title="My Drafts"
              value={draftCount}
              icon={FileText}
              to="/purchase-requests?status=DRAFT"
              description="Not yet submitted"
            />
            <StatCard
              title="In Progress"
              value={inProgressCount}
              icon={Clock}
              to="/purchase-requests?status=SUBMITTED,APPROVED"
              description="Submitted or approved"
            />
          </>
        )}

        {isManager && (
          <StatCard
            title="Pending My Approval"
            value={pendingApprovals.length}
            icon={CheckSquare}
            to="/approvals"
          />
        )}

        {(isStorekeeper || isAdmin) && (
          <>
            <StatCard
              title="Awaiting Fulfillment"
              value={awaitingFulfillment.length}
              icon={PackageCheck}
              to="/stock"
            />
            <StatCard
              title="Low Stock Items"
              value={lowStockItems.length}
              icon={AlertTriangle}
              to={isAdmin ? '/reports' : '/items?lowStock=true'}
              description={lowStockItems.length > 0 ? 'Needs attention' : undefined}
            />
          </>
        )}

        {isAdmin && (
          <>
            <StatCard title="Total Users" value={users.length} icon={Users} to="/users" />
            <StatCard
              title="Departments"
              value={departments.length}
              icon={Building2}
              to="/departments"
            />
            <StatCard title="Active Items" value={/* placeholder below */ '—'} icon={Package} to="/items" />
          </>
        )}
      </div>
    </div>
  );
}