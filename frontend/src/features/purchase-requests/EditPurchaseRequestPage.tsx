import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getPurchaseRequest, updatePurchaseRequest, submitPurchaseRequest } from './api';
import { PurchaseRequestForm, type FormValues } from './PurchaseRequestForm';
import { getErrorMessage } from '@/lib/api-error';
import { PageHeader } from '@/components/page-header';
import { useAuthStore } from '@/store/auth-store';

export function EditPurchaseRequestPage() {
  const { id } = useParams<{ id: string }>();
  const requestId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const { data: request, isLoading } = useQuery({
    queryKey: ['purchase-request', requestId],
    queryFn: () => getPurchaseRequest(requestId),
  });

  useEffect(() => {
    if (!request) return;
    const canEdit = request.status === 'DRAFT' && request.requesterId === currentUserId;
    if (!canEdit) {
      toast.error('This request can no longer be edited.');
      navigate(`/purchase-requests/${requestId}`, { replace: true });
    }
  }, [request, currentUserId, requestId, navigate]);

  function refreshLists() {
    queryClient.invalidateQueries({ queryKey: ['purchase-request', requestId] });
    queryClient.invalidateQueries({ queryKey: ['my-requests'] });
    queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
  }

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => updatePurchaseRequest(requestId, values),
    onSuccess: () => {
      toast.success('Purchase request updated.');
      refreshLists();
      navigate(`/purchase-requests/${requestId}`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const saveAndSubmitMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      await updatePurchaseRequest(requestId, values);
      return submitPurchaseRequest(requestId);
    },
    onSuccess: () => {
      toast.success('Purchase request submitted for approval.');
      refreshLists();
      navigate(`/purchase-requests/${requestId}`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (isLoading || !request) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={`Edit ${request.requestNumber}`} />
      <PurchaseRequestForm
        defaultValues={{
          purpose: request.purpose,
          lineItems: request.lineItems.map((li) => ({
            itemCode: li.item.code,
            requestedQuantity: li.requestedQuantity,
          })),
        }}
        onSave={(values) => saveMutation.mutate(values)}
        isSaving={saveMutation.isPending}
        saveLabel="Save changes"
        onSaveAndSubmit={(values) => saveAndSubmitMutation.mutate(values)}
        isSubmitting={saveAndSubmitMutation.isPending}
      />
    </div>
  );
}