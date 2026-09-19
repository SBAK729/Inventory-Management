import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getPurchaseRequest,
  submitPurchaseRequest,
  cancelPurchaseRequest,
  approvePurchaseRequest,
  rejectPurchaseRequest,
} from './api';
import { RejectDialog } from './RejectDialog';
import { IssueLineItemButton } from './IssueLineItemButton';
import { getErrorMessage } from '@/lib/api-error';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuthStore } from '@/store/auth-store';
import { Pencil, Send, X, Check, X as XIcon } from 'lucide-react';

export function PurchaseRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const requestId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const currentUserId = useAuthStore((s) => s.user?.id);
  const role = useAuthStore((s) => s.user?.role); // single declaration, used below by both manager + storekeeper checks

  const [cancelOpen, setCancelOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const { data: request, isLoading } = useQuery({
    queryKey: ['purchase-request', requestId],
    queryFn: () => getPurchaseRequest(requestId),
  });

  function refreshLists() {
    queryClient.invalidateQueries({ queryKey: ['purchase-request', requestId] });
    queryClient.invalidateQueries({ queryKey: ['my-requests'] });
    queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
    queryClient.invalidateQueries({ queryKey: ['approved-awaiting-fulfillment'] });
    queryClient.invalidateQueries({ queryKey: ['items'] });
  }

  const submitMutation = useMutation({
    mutationFn: () => submitPurchaseRequest(requestId),
    onSuccess: () => {
      toast.success('Request submitted for approval.');
      refreshLists();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelPurchaseRequest(requestId),
    onSuccess: () => {
      toast.success('Request cancelled.');
      refreshLists();
      navigate('/purchase-requests');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
      setCancelOpen(false);
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => approvePurchaseRequest(requestId),
    onSuccess: () => {
      toast.success('Request approved.');
      refreshLists();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectPurchaseRequest(requestId, reason || undefined),
    onSuccess: () => {
      toast.success('Request rejected.');
      refreshLists();
      setRejectOpen(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
      setRejectOpen(false);
    },
  });

  if (isLoading || !request) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  const isOwner = request.requesterId === currentUserId;
  const isDraft = request.status === 'DRAFT';
  const canManage = isOwner && isDraft;
  const canDecide = role === 'MANAGER' && request.status === 'SUBMITTED';
  const canFulfill = role === 'STOREKEEPER' && request.status === 'APPROVED';

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={request.requestNumber}
        description={new Date(request.requestDate).toLocaleString()}
        action={
          <div className="flex gap-2">
            {canManage && (
              <>
                <Button variant="outline" onClick={() => navigate(`/purchase-requests/${request.id}/edit`)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" onClick={() => setCancelOpen(true)}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
                  <Send className="mr-2 h-4 w-4" />
                  {submitMutation.isPending ? 'Submitting...' : 'Submit'}
                </Button>
              </>
            )}
            {canDecide && (
              <>
                <Button variant="outline" onClick={() => setRejectOpen(true)}>
                  <XIcon className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
                  <Check className="mr-2 h-4 w-4" />
                  {approveMutation.isPending ? 'Approving...' : 'Approve'}
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <StatusBadge status={request.status} />
        <span className="text-sm text-muted-foreground">
          {request.requester.fullName} · {request.department.name}
        </span>
      </div>

      {request.status === 'REJECTED' && request.rejectionReason && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            <strong>Rejection reason:</strong> {request.rejectionReason}
          </AlertDescription>
        </Alert>
      )}

      {request.approver && (
        <p className="mb-4 text-sm text-muted-foreground">
          {request.status === 'APPROVED' ? 'Approved' : 'Decided'} by {request.approver.fullName}
          {request.decidedAt && ` on ${new Date(request.decidedAt).toLocaleDateString()}`}
        </p>
      )}

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Purpose</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{request.purpose}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Requested</TableHead>
                <TableHead className="text-right">Issued</TableHead>
                {canFulfill && <TableHead className="text-right">Fulfill</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {request.lineItems.map((li) => (
                <TableRow key={li.id}>
                  <TableCell>{li.item.code}</TableCell>
                  <TableCell>
                    {li.item.name} <span className="text-muted-foreground">({li.item.unit})</span>
                  </TableCell>
                  <TableCell className="text-right">{li.requestedQuantity}</TableCell>
                  <TableCell className="text-right">{li.issuedQuantity}</TableCell>
                  {canFulfill && (
                    <TableCell>
                      <IssueLineItemButton
                        requestId={request.id}
                        itemCode={li.item.code}
                        remaining={li.requestedQuantity - li.issuedQuantity}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this request?"
        description="This draft request will be permanently deleted. This can't be undone."
        confirmLabel="Cancel request"
        destructive
        isLoading={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
      />

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        isLoading={rejectMutation.isPending}
        onConfirm={(reason) => rejectMutation.mutate(reason)}
      />
    </div>
  );
}