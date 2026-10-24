import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { LifecycleFields } from '@/components/lifecycle-fields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import inquiries from '@/routes/inquiries';
import { IntakeContactFields } from '../../contacts/_components/intake-contact-fields';
import { contactName } from '../../workflow-support';
import type { ContactOption, ListingOption } from '../../workflow-support';
import type { InquiryFormData, InquiryStatus, InquirySummary } from '../types';

const statuses: InquiryStatus[] = [
    'New',
    'Contacted',
    'Qualified',
    'Converted',
    'Closed',
];

type InquiryFormProps = {
    canCreateContact?: boolean;
    inquiry?: InquirySummary;
    listings: ListingOption[];
    contacts: ContactOption[];
};

export function InquiryForm({
    canCreateContact = false,
    inquiry,
    listings,
    contacts,
}: InquiryFormProps) {
    const { data, setData, post, put, transform, processing, errors } =
        useForm<InquiryFormData>({
            operation: 'transition',
            reason: '',
            new_contact:
                !inquiry && canCreateContact && contacts.length === 0
                    ? { first_name: '', last_name: '', email: '', phone: '' }
                    : null,
            listing_id: inquiry?.listing_id ?? listings[0]?.id ?? '',
            contact_id: inquiry?.contact_id ?? contacts[0]?.id ?? '',
            status: inquiry?.status ?? 'New',
            source: inquiry?.source ?? 'Manual',
            intent: inquiry?.intent ?? '',
            budget: inquiry?.budget ?? '',
        });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        transform((values) => {
            const { new_contact, ...existing } = values;

            return new_contact
                ? { ...existing, contact_id: '', new_contact }
                : existing;
        });

        if (inquiry) {
            put(inquiries.update(inquiry).url);

            return;
        }

        post(inquiries.store.form().action);
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid gap-4 border-b border-border bg-card px-4 py-5 md:grid-cols-3 md:px-6">
                <Field label="Listing" error={errors.listing_id}>
                    <Select
                        value={data.listing_id}
                        onValueChange={(value) => setData('listing_id', value)}
                    >
                        <SelectTrigger className="w-full bg-card">
                            <SelectValue placeholder="Select listing" />
                        </SelectTrigger>
                        <SelectContent>
                            {listings.map((listing) => (
                                <SelectItem key={listing.id} value={listing.id}>
                                    {listing.address}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>

                <Field label="Contact" error={errors.contact_id}>
                    <Select
                        disabled={processing || data.new_contact !== null}
                        value={data.contact_id}
                        onValueChange={(value) => setData('contact_id', value)}
                    >
                        <SelectTrigger className="w-full bg-card">
                            <SelectValue placeholder="Select contact" />
                        </SelectTrigger>
                        <SelectContent>
                            {contacts.map((contact) => (
                                <SelectItem key={contact.id} value={contact.id}>
                                    {contactName(contact)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>

                <Field label="Status" error={errors.status}>
                    <Select
                        value={data.status}
                        onValueChange={(value) =>
                            setData('status', value as InquiryStatus)
                        }
                    >
                        <SelectTrigger className="w-full bg-card">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            {statuses
                                .filter((status) => inquiry || status === 'New')
                                .map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {status}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </Field>
            </div>

            {!inquiry && canCreateContact && (
                <div className="px-6">
                    <IntakeContactFields
                        prefix="new_contact"
                        value={data.new_contact}
                        onChange={(value) => setData('new_contact', value)}
                        errors={errors}
                        disabled={processing}
                    />
                </div>
            )}
            {contacts.length === 0 && !data.new_contact && (
                <p className="px-6 text-sm text-muted-foreground">
                    No accessible contacts are available.
                    {canCreateContact
                        ? ' Create a new contact to continue.'
                        : ' Ask an administrator to link a contact.'}
                </p>
            )}

            <div className="grid gap-4 px-4 md:grid-cols-3 md:px-6">
                <Field label="Source" error={errors.source}>
                    <Input
                        value={data.source}
                        onChange={(event) =>
                            setData('source', event.target.value)
                        }
                    />
                </Field>
                <Field label="Intent" error={errors.intent}>
                    <Input
                        value={data.intent}
                        onChange={(event) =>
                            setData('intent', event.target.value)
                        }
                        placeholder="buy, rent, invest"
                    />
                </Field>
                <Field label="Budget" error={errors.budget}>
                    <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={data.budget}
                        onChange={(event) =>
                            setData('budget', event.target.value)
                        }
                    />
                </Field>
            </div>

            {inquiry && (
                <LifecycleFields
                    operation={data.operation}
                    reason={data.reason}
                    onOperation={(value) => setData('operation', value)}
                    onReason={(value) => setData('reason', value)}
                    errors={errors}
                />
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card px-4 py-4 md:px-6">
                <Button variant="outline" asChild>
                    <Link
                        href={
                            inquiry
                                ? inquiries.show(inquiry)
                                : inquiries.index()
                        }
                    >
                        <ArrowLeft />
                        Cancel
                    </Link>
                </Button>
                <Button
                    type="submit"
                    disabled={
                        processing || (!data.new_contact && !data.contact_id)
                    }
                >
                    <Save />
                    {processing ? 'Saving' : 'Save inquiry'}
                </Button>
            </div>
        </form>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {children}
            {error && (
                <p className="text-xs font-medium text-destructive">{error}</p>
            )}
        </div>
    );
}
