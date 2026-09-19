import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createPurchaseRequest, submitPurchaseRequest } from './api';
import { PurchaseRequestForm, type FormValues } from './PurchaseRequestForm';
import { getErrorMessage } from '@/lib/api-error';
import { PageHeader } from '@/components/page-header';

export function NewPurchaseRequestPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  function refreshLists() {
    queryClient.invalidateQueries({ queryKey: ['my-requests'] });
    queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
  }

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => createPurchaseRequest(values),
    onSuccess: (request) => {
      toast.success('Purchase request saved as draft.');
      refreshLists();
      navigate(`/purchase-requests/${request.id}`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const saveAndSubmitMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const request = await createPurchaseRequest(values);
      return submitPurchaseRequest(request.id);
    },
    onSuccess: (request) => {
      toast.success('Purchase request submitted for approval.');
      refreshLists();
      navigate(`/purchase-requests/${request.id}`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="New Purchase Request" description="Create a new request." />
      <PurchaseRequestForm
        onSave={(values) => saveMutation.mutate(values)}
        isSaving={saveMutation.isPending}
        saveLabel="Save as Draft"
        onSaveAndSubmit={(values) => saveAndSubmitMutation.mutate(values)}
        isSubmitting={saveAndSubmitMutation.isPending}
      />
    </div>
  );
}