import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { PublicHeader } from './public-header';

type PublicLayoutProps = {
    title: string;
    active?: 'Browse' | 'Saved' | 'Deal' | 'Concierge';
    sticky?: boolean;
    children: ReactNode;
};

export function PublicLayout({
    title,
    active,
    sticky = false,
    children,
}: PublicLayoutProps) {
    return (
        <>
            <Head title={title} />
            <div className="min-h-screen bg-background text-foreground">
                <PublicHeader active={active} sticky={sticky} />
                <main>{children}</main>
            </div>
        </>
    );
}
