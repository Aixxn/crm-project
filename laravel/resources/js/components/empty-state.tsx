import type { ReactNode } from 'react';

export function EmptyState({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-40 items-center justify-center rounded-md border border-dashed border-border bg-muted px-4 text-center text-sm text-muted-foreground">
            {children}
        </div>
    );
}
