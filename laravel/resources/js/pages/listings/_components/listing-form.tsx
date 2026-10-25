import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ImagePlus, Save, X } from 'lucide-react';
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
import listings from '@/routes/listings';
import { IntakeContactFields } from '../../contacts/_components/intake-contact-fields';
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
    canCreateContact?: boolean;
    agents: AgentSummary[];
    owners: ContactSummary[];
    listing?: ListingSummary;
};

export function ListingForm({
    canCreateContact = false,
    agents,
    owners,
    listing,
}: ListingFormProps) {
    const isEditing = Boolean(listing);
    const { data, setData, post, put, transform, processing, errors } =
        useForm<ListingFormData>({
            operation: 'transition',
            reason: '',
            new_owner:
                !listing && canCreateContact && owners.length === 0
                    ? { first_name: '', last_name: '', email: '', phone: '' }
                    : null,
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
            images: [],
        });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        transform((values) => {
            const { new_owner, ...existing } = values;

            return new_owner
                ? { ...existing, owner_contact_id: '', new_owner }
                : existing;
        });

        if (listing) {
            put(listings.update(listing).url);

            return;
        }

        post(listings.store.form().action, { forceFormData: true });
    };

    const updateImages = (files: FileList | null) => {
        if (!files) {
            setData('images', []);

            return;
        }

        setData('images', Array.from(files).slice(0, 3));
    };

    const removeImage = (index: number) => {
        setData(
            'images',
            data.images.filter((_, currentIndex) => currentIndex !== index),
        );
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid gap-4 border-b border-border bg-card px-6 py-5 md:grid-cols-2 lg:grid-cols-4">
                <Field label="Status" error={errors.status}>
                    <Select
                        value={data.status}
                        onValueChange={(value) =>
                            setData('status', value as ListingStatus)
                        }
                    >
                        <SelectTrigger
                            aria-label="Status"
                            className="w-full border-input bg-card"
                        >
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            {listingStatuses
                                .filter(
                                    (status) => listing || status === 'Draft',
                                )
                                .map((status) => (
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
                        <SelectTrigger
                            aria-label="Assigned agent"
                            className="w-full border-input bg-card"
                        >
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
                        disabled={processing || data.new_owner !== null}
                        value={data.owner_contact_id}
                        onValueChange={(value) =>
                            setData('owner_contact_id', value)
                        }
                    >
                        <SelectTrigger
                            aria-label="Owner contact"
                            className="w-full border-input bg-card"
                        >
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
                        className="border-input bg-card"
                        value={data.property_type}
                        onChange={(event) =>
                            setData('property_type', event.target.value)
                        }
                        placeholder="Condo, house, land"
                    />
                </Field>
            </div>

            {!listing && canCreateContact && (
                <div className="px-6">
                    <IntakeContactFields
                        prefix="new_owner"
                        value={data.new_owner}
                        onChange={(value) => setData('new_owner', value)}
                        errors={errors}
                        disabled={processing}
                    />
                </div>
            )}
            {owners.length === 0 && !data.new_owner && (
                <p className="px-6 text-sm text-muted-foreground">
                    No accessible contacts are available.
                    {canCreateContact
                        ? ' Create a new contact to continue.'
                        : ' Ask an administrator to link a contact.'}
                </p>
            )}

            <div className="grid gap-5 px-6 md:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="space-y-4">
                    <Field label="Address" error={errors.address}>
                        <Input
                            className="border-input bg-card"
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
                                className="border-input bg-card"
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
                                className="border-input bg-card"
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
                                className="border-input bg-card"
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
                                className="border-input bg-card"
                                type="number"
                                min="0"
                                value={data.area_sqft}
                                onChange={(event) =>
                                    setData('area_sqft', event.target.value)
                                }
                            />
                        </Field>
                    </div>

                    {!isEditing && (
                        <Field label="Listing images" error={errors.images}>
                            <div className="rounded-md border border-dashed border-border bg-card p-4">
                                <div className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-sm bg-muted px-4 text-center text-sm text-muted-foreground hover:bg-muted/80">
                                    <ImagePlus className="mb-3 size-8 text-primary" />
                                    <span className="font-medium text-foreground">
                                        Upload up to 3 photos
                                    </span>
                                    <span className="mt-1">
                                        PNG or JPG only
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg"
                                        multiple
                                        className="sr-only"
                                        onChange={(event) =>
                                            updateImages(event.target.files)
                                        }
                                    />
                                </div>
                                {data.images.length > 0 && (
                                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                        {data.images.map((image, index) => (
                                            <div
                                                key={`${image.name}-${index}`}
                                                className="flex items-center justify-between gap-2 rounded-sm border border-border px-3 py-2 text-sm text-foreground"
                                            >
                                                <span className="truncate">
                                                    {image.name}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeImage(index)
                                                    }
                                                    className="text-muted-foreground hover:text-destructive"
                                                    aria-label={`Remove ${image.name}`}
                                                >
                                                    <X className="size-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="mt-3 text-xs text-muted-foreground">
                                    If more than 3 files are selected, only the
                                    first 3 will be uploaded.
                                </div>
                            </div>
                        </Field>
                    )}
                </div>

                <div className="rounded-md border border-border bg-card p-4">
                    <div className="text-sm font-semibold text-foreground">
                        Listing setup
                    </div>
                    <dl className="mt-4 space-y-3 text-sm">
                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-muted-foreground">Mode</dt>
                            <dd className="font-medium text-foreground">
                                {isEditing ? 'Edit' : 'Create'}
                            </dd>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-muted-foreground">Agents</dt>
                            <dd className="font-medium text-foreground">
                                {agents.length}
                            </dd>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-muted-foreground">Owners</dt>
                            <dd className="font-medium text-foreground">
                                {owners.length}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            {listing && (
                <LifecycleFields
                    operation={data.operation}
                    reason={data.reason}
                    onOperation={(value) => setData('operation', value)}
                    onReason={(value) => setData('reason', value)}
                    errors={errors}
                />
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background px-6 py-4">
                <Button
                    variant="outline"
                    asChild
                    className="rounded-sm border-border bg-card text-foreground hover:bg-muted"
                >
                    <Link
                        href={
                            listing ? listings.show(listing) : listings.index()
                        }
                    >
                        <ArrowLeft />
                        Cancel
                    </Link>
                </Button>
                <Button
                    type="submit"
                    disabled={processing}
                    className="rounded-sm bg-primary text-primary-foreground hover:bg-primary/90"
                >
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
            <Label className="grid gap-2 text-sm font-medium text-foreground">
                {label}
                {children}
            </Label>
            {error && (
                <p
                    role="alert"
                    className="text-xs font-medium text-destructive"
                >
                    {error}
                </p>
            )}
        </div>
    );
}

function contactName(contact: ContactSummary) {
    return `${contact.first_name} ${contact.last_name}`.trim();
}
