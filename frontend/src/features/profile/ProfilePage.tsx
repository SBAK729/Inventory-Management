import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDepartments } from '@/features/departments/api';
import { useAuthStore } from '@/store/auth-store';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LogOut, KeyRound } from 'lucide-react';

export function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  });

  const departmentName = user?.departmentId
    ? departments.find((d) => d.id === user.departmentId)?.name
    : null;

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Profile" description="Your account details." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{user.fullName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>{user.email}</span>

            <span className="text-muted-foreground">Role</span>
            <span>
              <Badge variant="outline">{user.role}</Badge>
            </span>

            <span className="text-muted-foreground">Department</span>
            <span>{departmentName ?? '—'}</span>
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/change-password')}>
              <KeyRound className="mr-2 h-4 w-4" />
              Change password
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
