import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
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
import offers from '@/routes/offers';
import { contactName } from '../../workflow-support';
import type { ContactOption, ListingOption } from '../../workflow-support';
import type { OfferFormData, OfferStatus, OfferSummary } from '../types';

const statuses: OfferStatus[] = [
    'Submitted',
    'Accepted',
    'Rejected',
    'Withdrawn',
];

type OfferFormProps = {
    offer?: OfferSummary;
    listings: ListingOption[];
    contacts: ContactOption[];
};

export function OfferForm({ offer, listings, contacts }: OfferFormProps) {
    const { data, setData, post, processing, errors } = useForm<OfferFormData>({
        listing_id: offer?.listing_id ?? listings[0]?.id ?? '',
        contact_id: offer?.contact_id ?? contacts[0]?.id ?? '',
        status: offer?.status ?? 'Submitted',
        amount: offer?.amount ?? '',
        notes: offer?.notes ?? '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (offer) {
            post(offers.update.form.put(offer).action);

            return;
        }

        post(offers.store.form().action);
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid gap-4 border-b border-[#C3C6D7]/70 bg-white px-4 py-5 md:grid-cols-2 md:px-6 lg:grid-cols-4">
                <Field label="Listing" error={errors.listing_id}>
                    <Select
                        value={data.listing_id}
                        onValueChange={(value) => setData('listing_id', value)}
                    >
                        <SelectTrigger className="w-full bg-white">
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
                        value={data.contact_id}
                        onValueChange={(value) => setData('contact_id', value)}
                    >
                        <SelectTrigger className="w-full bg-white">
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
                            setData('status', value as OfferStatus)
                        }
                    >
                        <SelectTrigger className="w-full bg-white">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            {statuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                    {status}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
                <Field label="Amount" error={errors.amount}>
                    <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={data.amount}
                        onChange={(event) =>
                            setData('amount', event.target.value)
                        }
                    />
                </Field>
            </div>
            <div className="px-4 md:px-6">
                <Field label="Notes" error={errors.notes}>
                    <textarea
                        value={data.notes}
                        onChange={(event) =>
                            setData('notes', event.target.value)
                        }
                        className="min-h-36 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    />
                </Field>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#C3C6D7]/70 bg-white px-4 py-4 md:px-6">
                <Button variant="outline" asChild>
                    <Link href={offer ? offers.show(offer) : offers.index()}>
                        <ArrowLeft />
                        Cancel
                    </Link>
                </Button>
                <Button type="submit" disabled={processing}>
                    <Save />
                    {processing ? 'Saving' : 'Save offer'}
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
                <p className="text-xs font-medium text-red-600">{error}</p>
            )}
        </div>
    );
}
