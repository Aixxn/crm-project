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
import listings from '@/routes/listings';
import type {
    AgentSummary,
    ContactSummary,
    ListingFormData,
    ListingSummary,
    ListingStatus,
} from '../types';

const listingStatuses: ListingStatus[] = [
    'Draft',
    'Active',
    'Under Offer',
    'Closed',
    'Closed Lost',
];

type ListingFormProps = {
    agents: AgentSummary[];
    owners: ContactSummary[];
    listing?: ListingSummary;
};

export function ListingForm({ agents, owners, listing }: ListingFormProps) {
    const isEditing = Boolean(listing);
    const { data, setData, post, processing, errors } =
        useForm<ListingFormData>({
            assigned_agent_id:
                listing?.assigned_agent_id.toString() ??
                agents[0]?.id.toString() ??
                '',
            owner_contact_id: listing?.owner_contact_id ?? owners[0]?.id ?? '',
            status: listing?.status ?? 'Draft',
            address: listing?.address ?? '',
            property_type: listing?.property_type ?? '',
            price: listing?.price ?? '',
            bedrooms: listing?.bedrooms?.toString() ?? '',
            bathrooms: listing?.bathrooms ?? '',
            area_sqft: listing?.area_sqft?.toString() ?? '',
        });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (listing) {
            post(listings.update.form.put(listing).action);

            return;
        }

        post(listings.store.form().action);
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid gap-4 border-b border-[#C3C6D7]/70 bg-white px-4 py-5 md:grid-cols-2 md:px-6 lg:grid-cols-4">
                <Field label="Status" error={errors.status}>
                    <Select
                        value={data.status}
                        onValueChange={(value) =>
                            setData('status', value as ListingStatus)
                        }
                    >
                        <SelectTrigger className="w-full bg-white">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            {listingStatuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                    {status}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>

                <Field label="Assigned agent" error={errors.assigned_agent_id}>
                    <Select
                        value={data.assigned_agent_id}
                        onValueChange={(value) =>
                            setData('assigned_agent_id', value)
                        }
                    >
                        <SelectTrigger className="w-full bg-white">
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

                <Field label="Owner contact" error={errors.owner_contact_id}>
                    <Select
                        value={data.owner_contact_id}
                        onValueChange={(value) =>
                            setData('owner_contact_id', value)
                        }
                    >
                        <SelectTrigger className="w-full bg-white">
                            <SelectValue placeholder="Select owner" />
                        </SelectTrigger>
                        <SelectContent>
                            {owners.map((owner) => (
                                <SelectItem key={owner.id} value={owner.id}>
                                    {contactName(owner)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>

                <Field label="Property type" error={errors.property_type}>
                    <Input
                        value={data.property_type}
                        onChange={(event) =>
                            setData('property_type', event.target.value)
                        }
                        placeholder="Condo, house, land"
                    />
                </Field>
            </div>

            <div className="grid gap-5 px-4 md:grid-cols-[minmax(0,1fr)_18rem] md:px-6">
                <div className="space-y-4">
                    <Field label="Address" error={errors.address}>
                        <Input
                            value={data.address}
                            onChange={(event) =>
                                setData('address', event.target.value)
                            }
                            placeholder="Street, city, state"
                        />
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Field label="Price" error={errors.price}>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={data.price}
                                onChange={(event) =>
                                    setData('price', event.target.value)
                                }
                            />
                        </Field>

                        <Field label="Bedrooms" error={errors.bedrooms}>
                            <Input
                                type="number"
                                min="0"
                                value={data.bedrooms}
                                onChange={(event) =>
                                    setData('bedrooms', event.target.value)
                                }
                            />
                        </Field>

                        <Field label="Bathrooms" error={errors.bathrooms}>
                            <Input
                                type="number"
                                min="0"
                                step="0.5"
                                value={data.bathrooms}
                                onChange={(event) =>
                                    setData('bathrooms', event.target.value)
                                }
                            />
                        </Field>

                        <Field label="Area sqft" error={errors.area_sqft}>
                            <Input
                                type="number"
                                min="0"
                                value={data.area_sqft}
                                onChange={(event) =>
                                    setData('area_sqft', event.target.value)
                                }
                            />
                        </Field>
                    </div>
                </div>

                <div className="rounded-md border border-[#C3C6D7] bg-white p-4">
                    <div className="text-sm font-medium text-neutral-950">
                        Form state
                    </div>
                    <dl className="mt-4 space-y-3 text-sm">
                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-neutral-500">Mode</dt>
                            <dd className="font-medium text-neutral-900">
                                {isEditing ? 'Edit' : 'Create'}
                            </dd>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-neutral-500">Agents</dt>
                            <dd className="font-medium text-neutral-900">
                                {agents.length}
                            </dd>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-neutral-500">Owners</dt>
                            <dd className="font-medium text-neutral-900">
                                {owners.length}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#C3C6D7]/70 bg-white px-4 py-4 md:px-6">
                <Button variant="outline" asChild>
                    <Link
                        href={
                            listing ? listings.show(listing) : listings.index()
                        }
                    >
                        <ArrowLeft />
                        Cancel
                    </Link>
                </Button>
                <Button type="submit" disabled={processing}>
                    <Save />
                    {processing ? 'Saving' : 'Save listing'}
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

function contactName(contact: ContactSummary) {
    return `${contact.first_name} ${contact.last_name}`.trim();
}
