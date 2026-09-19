import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { getDepartments, deleteDepartment } from './api';
import { DepartmentFormDialog } from './DepartmentFormDialog';
import { getErrorMessage } from '@/lib/api-error';
import type { Department } from '@/types/department';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteDepartment(id),
    onSuccess: () => {
      toast.success('Department deleted.');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setDeletingDepartment(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
      setDeletingDepartment(null);
    },
  });

  const columns: ColumnDef<Department>[] = [
    { accessorKey: 'name', header: 'Name' },
    {
      id: 'manager',
      header: 'Manager',
      cell: ({ row }) => row.original.manager?.fullName ?? (
        <span className="text-muted-foreground">Unassigned</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setEditingDepartment(row.original);
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
              setDeletingDepartment(row.original);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Departments"
        description="Manage departments and their assigned managers."
        action={
          <Button
            onClick={() => {
              setEditingDepartment(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Department
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={departments}
        isLoading={isLoading}
        emptyMessage="No departments yet. Create your first one."
      />

      <DepartmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        department={editingDepartment}
      />

      <ConfirmDialog
        open={!!deletingDepartment}
        onOpenChange={(open) => !open && setDeletingDepartment(null)}
        title="Delete department?"
        description={`This will permanently delete "${deletingDepartment?.name}". This can't be undone.`}
        confirmLabel="Delete"
        destructive
        isLoading={deleteMutation.isPending}
        onConfirm={() => deletingDepartment && deleteMutation.mutate(deletingDepartment.id)}
      />
    </div>
  );
}