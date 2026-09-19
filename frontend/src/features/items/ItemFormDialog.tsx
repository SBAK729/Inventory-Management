import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createItem, updateItem } from './api';
import { getErrorMessage } from '@/lib/api-error';
import type { Item } from '@/types/item';
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
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const schema = z.object({
  code: z.string().min(1, 'Item code is required.'),
  name: z.string().min(1, 'Item name is required.'),
  category: z.string().min(1, 'Category is required.'),
  unit: z.string().min(1, 'Unit is required.'),
  currentQuantity: z.coerce.number().int().min(0, 'Cannot be negative.').optional(),
  minQuantity: z.coerce.number().int().min(0, 'Cannot be negative.'),
});

type FormValues = z.infer<typeof schema>;

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Item | null;
}

export function ItemFormDialog({ open, onOpenChange, item }: ItemFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = !!item;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: '',
      name: '',
      category: '',
      unit: '',
      currentQuantity: 0,
      minQuantity: 0,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        code: item?.code ?? '',
        name: item?.name ?? '',
        category: item?.category ?? '',
        unit: item?.unit ?? '',
        currentQuantity: item?.currentQuantity ?? 0,
        minQuantity: item?.minQuantity ?? 0,
      });
    }
  }, [open, item, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (isEdit) {
        return updateItem(item!.id, {
          name: values.name,
          category: values.category,
          unit: values.unit,
          minQuantity: values.minQuantity,
        });
      }
      return createItem(values);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Item updated.' : 'Item created.');
      queryClient.invalidateQueries({ queryKey: ['items'] });
      onOpenChange(false);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Item' : 'Add Item'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItemWrapper>
                    <FormLabel>Item code</FormLabel>
                    <FormControl>
                      <Input placeholder="ITM-003" {...field} disabled={isEdit} />
                    </FormControl>
                    <FormMessage />
                  </FormItemWrapper>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItemWrapper>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="pcs, box, ream..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItemWrapper>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItemWrapper>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. A4 Printer Paper" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItemWrapper>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItemWrapper>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Stationery" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItemWrapper>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {!isEdit && (
                <FormField
                  control={form.control}
                  name="currentQuantity"
                  render={({ field }) => (
                    <FormItemWrapper>
                      <FormLabel>Opening quantity</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItemWrapper>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="minQuantity"
                render={({ field }) => (
                  <FormItemWrapper>
                    <FormLabel>Minimum quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItemWrapper>
                )}
              />
            </div>

            {isEdit && (
              <p className="text-sm text-muted-foreground">
                Current quantity ({item?.currentQuantity}) is adjusted via Stock
                receipts/issues, not edited here.
              </p>
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