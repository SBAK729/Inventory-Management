import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';

import { LoginPage } from '@/features/auth/LoginPage';
import { ChangePasswordPage } from '@/features/auth/ChangePasswordPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { ItemsPage } from '@/features/items/ItemsPage';
import { DepartmentsPage } from '@/features/departments/DepartmentsPage';
import { UsersPage } from '@/features/users/UsersPage';
import { MyRequestsPage } from '@/features/purchase-requests/MyRequestsPage';
import { NewPurchaseRequestPage } from '@/features/purchase-requests/NewPurchaseRequestPage';
import { EditPurchaseRequestPage } from '@/features/purchase-requests/EditPurchaseRequestPage';
import { PurchaseRequestDetailPage } from '@/features/purchase-requests/PurchaseRequestDetailPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { PendingApprovalsPage } from '@/features/purchase-requests/PendingApprovalsPage';
import { AllRequestsPage } from '@/features/purchase-requests/AllRequestsPage';

import { RequireAuth } from '@/routes/RequireAuth';
import { RequireRole } from '@/routes/RequireRole';
import { AppLayout } from '@/routes/AppLayout';
import { StockPage } from '@/features/stock/StockPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ReportsPage } from '@/features/reports/ReportsPage';

function Placeholder({ label }: { label: string }) {
  return <div className="text-muted-foreground">{label} — coming in a later phase.</div>;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/change-password" element={<ChangePasswordPage />} />

          <Route element={<AppLayout />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/" element={<DashboardPage />} />
            <Route path="/purchase-requests" element={<MyRequestsPage />} />
            <Route path="/purchase-requests/new" element={<NewPurchaseRequestPage />} />
            <Route path="/purchase-requests/:id" element={<PurchaseRequestDetailPage />} />
            <Route path="/purchase-requests/:id/edit" element={<EditPurchaseRequestPage />} />

            <Route element={<RequireRole roles={['ADMIN', 'STOREKEEPER']} />}>
              <Route path="/items" element={<ItemsPage />} />
              <Route path="/stock" element={<StockPage />} />
            </Route>

            <Route element={<RequireRole roles={['ADMIN']} />}>
              <Route path="/departments" element={<DepartmentsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/purchase-requests/all" element={<AllRequestsPage />} />
            </Route>

            <Route element={<RequireRole roles={['ADMIN', 'MANAGER']} />}>
              <Route path="/approvals" element={<PendingApprovalsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;