import { Badge } from '@/components/ui/badge';
import { statusPresentation } from '@/lib/workflow-status';
import type { WorkflowDomain } from '@/lib/workflow-status';

const toneClasses = {
    neutral:
        'border-status-neutral-border bg-status-neutral text-status-neutral-foreground',
    info: 'border-status-info-border bg-status-info text-status-info-foreground',
    warning:
        'border-status-warning-border bg-status-warning text-status-warning-foreground',
    success:
        'border-status-success-border bg-status-success text-status-success-foreground',
    danger: 'border-status-danger-border bg-status-danger text-status-danger-foreground',
} as const;

export function StatusBadge({
    domain,
    status,
}: {
    domain: WorkflowDomain;
    status: string;
}) {
    const presentation = statusPresentation(domain, status);

    return (
        <Badge variant="outline" className={toneClasses[presentation.tone]}>
            {presentation.label}
        </Badge>
    );
}
