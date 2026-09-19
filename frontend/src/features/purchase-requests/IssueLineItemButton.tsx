import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { issueStock } from '@/features/stock/api';
import { getErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface IssueLineItemButtonProps {
  requestId: number;
  itemCode: string;
  remaining: number;
}

export function IssueLineItemButton({ requestId, itemCode, remaining }: IssueLineItemButtonProps) {
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(remaining);

  const mutation = useMutation({
    mutationFn: () => issueStock(itemCode, quantity, requestId),
    onSuccess: () => {
      toast.success(`Issued ${quantity} of ${itemCode}.`);
      queryClient.invalidateQueries({ queryKey: ['purchase-request', requestId] });
      queryClient.invalidateQueries({ queryKey: ['approved-awaiting-fulfillment'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (remaining <= 0) {
    return <span className="text-sm text-muted-foreground">Fully issued</span>;
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Input
        type="number"
        min={1}
        max={remaining}
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        className="w-20"
      />
      <Button
        size="sm"
        disabled={mutation.isPending || quantity < 1 || quantity > remaining}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? 'Issuing...' : 'Issue'}
      </Button>
    </div>
  );
}