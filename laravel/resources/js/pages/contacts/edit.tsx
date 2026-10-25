import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';
import contacts from '@/routes/contacts';
import { ContactForm } from './_components/contact-form';
import type { ContactSummary } from './types';

type EditContactProps = {
    contact: ContactSummary;
};

export default function EditContact({ contact }: EditContactProps) {
    return (
        <>
            <Head title="Edit contact" />
            <main className="min-h-full bg-muted">
                <div className="border-b border-border bg-card px-4 py-4 md:px-6">
                    <h1 className="text-xl font-semibold text-foreground">
                        Edit contact
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {`${contact.first_name} ${contact.last_name ?? ''}`.trim()}
                    </p>
                </div>
                <ContactForm contact={contact} />
            </main>
        </>
    );
}

EditContact.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Contacts',
            href: contacts.index(),
        },
        {
            title: 'Edit',
            href: contacts.edit({ contact: ':contact' }),
        },
    ],
};
