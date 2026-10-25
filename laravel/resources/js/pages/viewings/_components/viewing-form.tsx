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
import { agencyDatetimeToIso, toAgencyDatetimeLocal } from '@/lib/agency-time';
import viewings from '@/routes/viewings';
import { contactName } from '../../workflow-support';
import type {
    AgentOption,
    ContactOption,
    ListingOption,
} from '../../workflow-support';
import type { ViewingFormData, ViewingStatus, ViewingSummary } from '../types';

const statuses: ViewingStatus[] = [
    'Requested',
    'Scheduled',
    'Completed',
    'No Show',
    'Cancelled',
];

type ViewingFormProps = {
    viewing?: ViewingSummary;
    listings: ListingOption[];
    contacts: ContactOption[];
    agents: AgentOption[];
};

export function ViewingForm({
    viewing,
    listings,
    contacts,
    agents,
}: ViewingFormProps) {
    const { data, setData, post, transform, processing, errors } =
        useForm<ViewingFormData>({
            operation: 'transition',
            reason: '',
            listing_id: viewing?.listing_id ?? listings[0]?.id ?? '',
            contact_id: viewing?.contact_id ?? contacts[0]?.id ?? '',
            agent_id:
                viewing?.agent_id.toString() ?? agents[0]?.id.toString() ?? '',
            status: viewing?.status ?? 'Scheduled',
            scheduled_at: toAgencyDatetimeLocal(viewing?.scheduled_at),
        });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        transform((values) => ({
            ...values,
            scheduled_at: agencyDatetimeToIso(values.scheduled_at),
        }));

        if (viewing) {
            post(viewings.update.form.put(viewing).action);

            return;
        }

        post(viewings.store.form().action);
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid gap-4 border-b border-border/70 bg-card px-4 py-5 md:grid-cols-2 md:px-6 lg:grid-cols-4">
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
                <Field label="Agent" error={errors.agent_id}>
                    <Select
                        value={data.agent_id}
                        onValueChange={(value) => setData('agent_id', value)}
                    >
                        <SelectTrigger className="w-full bg-card">
                            <SelectValue placeholder="Select agent" />
                        </SelectTrigger>
                        <SelectContent>
                            {agents.map((agent) => (
                                <SelectItem
                                    key={agent.id}
                                    value={agent.id.toString()}
                                >
                                    {agent.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
                <Field label="Status" error={errors.status}>
                    <Select
                        value={data.status}
                        onValueChange={(value) =>
                            setData('status', value as ViewingStatus)
                        }
                    >
                        <SelectTrigger className="w-full bg-card">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            {statuses
                                .filter(
                                    (status) =>
                                        viewing ||
                                        status === 'Requested' ||
                                        status === 'Scheduled',
                                )
                                .map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {status}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </Field>
            </div>

            <div className="px-4 md:px-6">
                <Field
                    label="Scheduled at (Asia/Manila)"
                    error={errors.scheduled_at}
                >
                    <Input
                        type="datetime-local"
                        step="1"
                        value={data.scheduled_at}
                        onChange={(event) =>
                            setData('scheduled_at', event.target.value)
                        }
                    />
                </Field>
            </div>

            {viewing && (
                <LifecycleFields
                    operation={data.operation}
                    reason={data.reason}
                    onOperation={(value) => setData('operation', value)}
                    onReason={(value) => setData('reason', value)}
                    errors={errors}
                />
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 bg-card px-4 py-4 md:px-6">
                <Button variant="outline" asChild>
                    <Link
                        href={
                            viewing ? viewings.show(viewing) : viewings.index()
                        }
                    >
                        <ArrowLeft />
                        Cancel
                    </Link>
                </Button>
                <Button type="submit" disabled={processing}>
                    <Save />
                    {processing ? 'Saving' : 'Save viewing'}
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
