import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { LifecycleOperation } from '@/types/lifecycle';

export function LifecycleFields({
    operation,
    reason,
    onOperation,
    onReason,
    errors,
    canReopen = false,
}: {
    operation: LifecycleOperation;
    reason: string;
    onOperation: (value: LifecycleOperation) => void;
    onReason: (value: string) => void;
    errors: { reason?: string; operation?: string };
    canReopen?: boolean;
}) {
    return (
        <div className="grid gap-4 rounded-md border border-border bg-card p-4 text-card-foreground md:grid-cols-2">
            <div className="space-y-2">
                <Label htmlFor="lifecycle-operation">Update purpose</Label>
                <select
                    id="lifecycle-operation"
                    value={operation}
                    onChange={(event) => {
                        const value = event.target.value;

                        if (
                            value === 'transition' ||
                            value === 'correct' ||
                            value === 'reopen'
                        ) {
                            onOperation(value);
                        }
                    }}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <option value="transition">Current activity</option>
                    <option value="correct">
                        Historical correction (Admin)
                    </option>
                    {canReopen && (
                        <option value="reopen">Reopen completed task</option>
                    )}
                </select>
                <p className="text-xs text-muted-foreground">
                    Historical corrections keep the current status and need an
                    administrator and a reason.
                </p>
                <InputError message={errors.operation} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="lifecycle-reason">
                    Reason{' '}
                    {operation !== 'transition' ? '(required)' : '(optional)'}
                </Label>
                <Input
                    id="lifecycle-reason"
                    value={reason}
                    onChange={(event) => onReason(event.target.value)}
                    required={operation !== 'transition'}
                    maxLength={2000}
                    aria-describedby="lifecycle-reason-error"
                />
                <InputError
                    id="lifecycle-reason-error"
                    message={errors.reason}
                />
            </div>
        </div>
    );
}
