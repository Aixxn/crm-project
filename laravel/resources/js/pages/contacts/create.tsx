import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';
import contacts from '@/routes/contacts';
import { ContactForm } from './_components/contact-form';

export default function CreateContact() {
    return (
        <>
            <Head title="Create contact" />
            <main className="min-h-full bg-[#FAF8FF]">
                <div className="border-b border-[#C3C6D7] bg-white px-4 py-4 md:px-6">
                    <h1 className="text-xl font-semibold text-neutral-950">
                        Create contact
                    </h1>
                    <p className="mt-1 text-sm text-neutral-600">
                        Add an owner, buyer, or tenant to the CRM workspace.
                    </p>
                </div>
                <ContactForm />
            </main>
        </>
    );
}

CreateContact.layout = {
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
            title: 'Create',
            href: contacts.create(),
        },
    ],
};
