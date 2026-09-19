import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getItems } from '@/features/items/api';
import { recordReceipt, issueStock } from './api';
import { getErrorMessage } from '@/lib/api-error';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const schema = z.object({
  itemCode: z.string().min(1, 'Select an item.'),
  quantity: z.coerce.number().int().min(1, 'Must be at least 1.'),
});

type FormValues = z.infer<typeof schema>;

interface StockActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'receipt' | 'issue';
}

export function StockActionDialog({ open, onOpenChange, mode }: StockActionDialogProps) {
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ['items', '', false],
    queryFn: () => getItems({}),
    enabled: open,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { itemCode: '', quantity: 1 },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      mode === 'receipt'
        ? recordReceipt(values.itemCode, values.quantity)
        : issueStock(values.itemCode, values.quantity),
    onSuccess: () => {
      toast.success(mode === 'receipt' ? 'Receipt recorded.' : 'Issue recorded.');
      queryClient.invalidateQueries({ queryKey: ['items'] });
      form.reset({ itemCode: '', quantity: 1 });
      onOpenChange(false);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'receipt' ? 'Record Stock Receipt' : 'Record Stock Issue'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
            <FormField
              control={form.control}
              name="itemCode"
              render={({ field }) => (
                <FormItemWrapper>
                  <FormLabel>Item</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                          {item.code} — {item.name} ({item.currentQuantity} {item.unit} on hand)
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
              name="quantity"
              render={({ field }) => (
                <FormItemWrapper>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItemWrapper>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : mode === 'receipt' ? 'Record Receipt' : 'Record Issue'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}