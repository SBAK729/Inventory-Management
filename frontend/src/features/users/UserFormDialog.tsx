import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createUser, updateUser } from './api';
import { getDepartments } from '@/features/departments/api';
import { getErrorMessage } from '@/lib/api-error';
import { ROLES } from '@/types/auth';
import type { User } from '@/types/user';
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
  FormItem as FormItemWrapper,
  FormLabel,
  FormDescription,
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
import { Switch } from '@/components/ui/switch';

const baseSchema = {
  fullName: z.string().min(1, 'Full name is required.'),
  email: z.string().email('Enter a valid email address.'),
  role: z.enum(ROLES),
  departmentId: z.string(), // "none" or numeric string from <Select>
  isActive: z.boolean(),
};

const createSchema = z.object({
  ...baseSchema,
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

const editSchema = z.object({
  ...baseSchema,
  password: z.string().min(6, 'Password must be at least 6 characters.').optional().or(z.literal('')),
});

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
}

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = !!user;
  const schema = isEdit ? editSchema : createSchema;

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
    enabled: open,
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      role: 'EMPLOYEE',
      departmentId: 'none',
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        fullName: user?.fullName ?? '',
        email: user?.email ?? '',
        password: '',
        role: user?.role ?? 'EMPLOYEE',
        departmentId: user?.departmentId ? String(user.departmentId) : 'none',
        isActive: user?.isActive ?? true,
      });
    }
  }, [open, user, form]);

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) => {
      const departmentId =
        values.departmentId === 'none' ? undefined : Number(values.departmentId);

      if (isEdit) {
        return updateUser(user!.id, {
          fullName: values.fullName,
          email: values.email,
          role: values.role,
          departmentId,
          isActive: values.isActive,
          ...(values.password ? { password: values.password } : {}),
        });
      }

      return createUser({
        fullName: values.fullName,
        email: values.email,
        password: (values as z.infer<typeof createSchema>).password,
        role: values.role,
        departmentId,
      });
    },
    onSuccess: () => {
      toast.success(isEdit ? 'User updated.' : 'User created.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onOpenChange(false);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit User' : 'Add User'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItemWrapper>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItemWrapper>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItemWrapper>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItemWrapper>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItemWrapper>
                  <FormLabel>{isEdit ? 'Reset password' : 'Password'}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  {isEdit && (
                    <FormDescription>Leave blank to keep the current password.</FormDescription>
                  )}
                  <FormMessage />
                </FormItemWrapper>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItemWrapper>
                    <FormLabel>Role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItemWrapper>
                )}
              />

              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItemWrapper>
                    <FormLabel>Department</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItemWrapper>
                )}
              />
            </div>

            {isEdit && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItemWrapper className="flex flex-row items-center justify-between rounded-md border p-3">
                    <div>
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Inactive users cannot log in, and any active sessions are revoked immediately.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItemWrapper>
                )}
              />
            )}

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