import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, type Role } from '@/store/auth-store';

export function RequireRole({ roles }: { roles: Role[] }) {
  const user = useAuthStore((s) => s.user);

  if (!user) return null; 
  if (!roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}