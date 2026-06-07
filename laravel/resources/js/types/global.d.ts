import type { Auth } from '@/types/auth';

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            notifications: {
                unreadCount: number;
                recent: Array<{
                    id: string;
                    title: string | null;
                    message: string | null;
                    href: string | null;
                    status: string | null;
                    price: number | null;
                    createdAt: string | null;
                }>;
            };
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
