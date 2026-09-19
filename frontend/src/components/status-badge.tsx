import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Status = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'FULFILLED';

const STATUS_STYLES: Record<Status, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
  SUBMITTED: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  APPROVED: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  REJECTED: 'bg-red-100 text-red-700 hover:bg-red-100',
  FULFILLED: 'bg-violet-100 text-violet-700 hover:bg-violet-100',
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant="secondary" className={cn('font-medium', STATUS_STYLES[status])}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}