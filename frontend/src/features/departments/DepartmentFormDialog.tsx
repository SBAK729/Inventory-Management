import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createDepartment, updateDepartment } from './api';
import { getUserOptions } from '@/features/users/api';
import { getErrorMessage } from '@/lib/api-error';
import type { Department } from '@/types/department';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const schema = z.object({
  name: z.string().min(1, 'Department name is required.'),
  managerId: z.string(), // "none" or a numeric string from the <Select>
});

type FormValues = z.infer<typeof schema>;

interface DepartmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department | null; // undefined/null = create mode
}

export function DepartmentFormDialog({
  open,
  onOpenChange,
  department,
}: DepartmentFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = !!department;

  const { data: userOptions = [] } = useQuery({
    queryKey: ['user-options'],
    queryFn: getUserOptions,
    enabled: open, // only fetch when the dialog is actually open
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', managerId: 'none' },
  });

  // Reset the form whenever we open for a different department (or for create).
  useEffect(() => {
    if (open) {
      form.reset({
        name: department?.name ?? '',
        managerId: department?.managerId ? String(department.managerId) : 'none',
      });
    }
  }, [open, department, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        name: values.name,
        managerId: values.managerId === 'none' ? undefined : Number(values.managerId),
      };
      return isEdit ? updateDepartment(department!.id, payload) : createDepartment(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Department updated.' : 'Department created.');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Department' : 'Add Department'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Procurement" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="managerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manager</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a manager" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {userOptions.map((u) => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          {u.fullName} ({u.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : isEdit ? 'Save changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}