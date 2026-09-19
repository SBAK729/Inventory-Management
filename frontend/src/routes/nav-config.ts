import type { Role } from '@/store/auth-store';
import { CheckSquare } from 'lucide-react';
import {
  LayoutDashboard,
  FileText,
  Package,
  Building2,
  Users,
  Boxes,
  BarChart3,
} from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  roles: Role[]; // which roles can see this nav item
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'STOREKEEPER'],
  },
  {
    label: 'My Requests',
    to: '/purchase-requests',
    icon: FileText,
    roles: ['EMPLOYEE', 'MANAGER'],
  },
  {
    label: 'All Requests',
    to: '/purchase-requests/all',
    icon: FileText,
    roles: ['ADMIN'],
  },
  {
    label: 'Items',
    to: '/items',
    icon: Package,
    roles: ['ADMIN', 'STOREKEEPER'],
  },
  {
    label: 'Stock',
    to: '/stock',
    icon: Boxes,
    roles: ['ADMIN', 'STOREKEEPER'],
  },
  {
    label: 'Departments',
    to: '/departments',
    icon: Building2,
    roles: ['ADMIN'],
  },
  {
    label: 'Users',
    to: '/users',
    icon: Users,
    roles: ['ADMIN'],
  },
  {
    label: 'Reports',
    to: '/reports',
    icon: BarChart3,
    roles: ['ADMIN', 'MANAGER'],
  },
  {
    label: 'Approvals',
    to: '/approvals',
    icon: CheckSquare,
    roles: ['MANAGER'],
  },
];