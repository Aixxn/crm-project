import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import type { Paginated } from '@/types/workflow';

function paginationLabel(label: string): string {
    const cleanLabel = label
        .replace('&laquo;', '')
        .replace('&raquo;', '')
        .trim();

    if (cleanLabel) {
        return cleanLabel;
    }

    return label.includes('&laquo;') ? 'Previous' : 'Next';
}

export function Pagination({ paginated }: { paginated: Paginated<unknown> }) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground">
            <span>
                Showing {paginated.from ?? 0}-{paginated.to ?? 0} of{' '}
                {paginated.total}
            </span>
            <div className="flex flex-wrap gap-1">
                {paginated.links.map((link) => (
                    <Button
                        key={`${link.label}-${link.url}`}
                        size="sm"
                        variant={link.active ? 'default' : 'outline'}
                        disabled={!link.url}
                        asChild={Boolean(link.url)}
                    >
                        {link.url ? (
                            <Link
                                href={link.url}
                                aria-current={link.active ? 'page' : undefined}
                            >
                                {paginationLabel(link.label)}
                            </Link>
                        ) : (
                            <span>{paginationLabel(link.label)}</span>
                        )}
                    </Button>
                ))}
            </div>
        </div>
    );
}
