import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { getItems } from '@/features/items/api';
import type { PurchaseRequestFormValues } from './api';
import {
  Form,
  FormControl,
  FormField,
  FormItem as FormItemWrapper,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

const lineItemSchema = z.object({
  itemCode: z.string().min(1, 'Select an item.'),
  requestedQuantity: z.coerce.number().int().min(1, 'Must be at least 1.'),
});

const schema = z
  .object({
    purpose: z.string().min(1, 'Purpose is required.'),
    lineItems: z.array(lineItemSchema).min(1, 'Add at least one item.'),
  })
  .refine(
    (data) => {
      const codes = data.lineItems.map((li) => li.itemCode);
      return new Set(codes).size === codes.length;
    },
    { message: 'Each item can only appear once per request.', path: ['lineItems'] },
  );

export type FormValues = z.infer<typeof schema>;

interface PurchaseRequestFormProps {
  defaultValues?: PurchaseRequestFormValues;
  onSave: (values: FormValues) => void;
  saveLabel?: string;
  isSaving?: boolean;
  onSaveAndSubmit?: (values: FormValues) => void;
  isSubmitting?: boolean;
}

export function PurchaseRequestForm({
  defaultValues,
  onSave,
  saveLabel = 'Save as Draft',
  isSaving,
  onSaveAndSubmit,
  isSubmitting,
}: PurchaseRequestFormProps) {
  const { data: items = [] } = useQuery({
    queryKey: ['items', '', false],
    queryFn: () => getItems({}),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {
      purpose: '',
      lineItems: [{ itemCode: '', requestedQuantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lineItems',
  });

  const busy = isSaving || isSubmitting;

  return (
    <Form {...form}>
      {/* type="button" throughout — each action button drives its own
          validated submit via form.handleSubmit(...) so having two submit
          buttons never causes ambiguous native form-submit behavior. */}
      <form className="space-y-6">
        <FormField
          control={form.control}
          name="purpose"
          render={({ field }) => (
            <FormItemWrapper>
              <FormLabel>Purpose</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What is this request for?"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItemWrapper>
          )}
        />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <FormLabel>Items</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ itemCode: '', requestedQuantity: 1 })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add item
            </Button>
          </div>

          {form.formState.errors.lineItems?.root && (
            <p className="mb-2 text-sm text-destructive">
              {form.formState.errors.lineItems.root.message}
            </p>
          )}
          {form.formState.errors.lineItems?.message && (
            <p className="mb-2 text-sm text-destructive">
              {form.formState.errors.lineItems.message}
            </p>
          )}

          <div className="space-y-3">
            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardContent className="flex items-start gap-3 pt-4">
                  <FormField
                    control={form.control}
                    name={`lineItems.${index}.itemCode`}
                    render={({ field }) => (
                      <FormItemWrapper className="flex-1">
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select an item" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {items.map((item) => (
                              <SelectItem key={item.code} value={item.code}>
                                {item.code} — {item.name} ({item.unit})
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
                    name={`lineItems.${index}.requestedQuantity`}
                    render={({ field }) => (
                      <FormItemWrapper className="w-28">
                        <FormControl>
                          <Input type="number" min={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItemWrapper>
                    )}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={form.handleSubmit(onSave)}
          >
            {isSaving ? 'Saving...' : saveLabel}
          </Button>

          {onSaveAndSubmit && (
            <Button
              type="button"
              disabled={busy}
              onClick={form.handleSubmit(onSaveAndSubmit)}
            >
              {isSubmitting ? 'Submitting...' : 'Save & Submit'}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}