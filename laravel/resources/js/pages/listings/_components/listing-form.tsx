import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ImagePlus, Save, X } from 'lucide-react';
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
            images: [],
        });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (listing) {
            post(listings.update.form.put(listing).action);

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
            <div className="grid gap-4 border-b border-[#c4c8d9] bg-white px-6 py-5 md:grid-cols-2 lg:grid-cols-4">
                <Field label="Status" error={errors.status}>
                    <Select
                        value={data.status}
                        onValueChange={(value) =>
                            setData('status', value as ListingStatus)
                        }
                    >
                        <SelectTrigger className="w-full border-[#c4c8d9] bg-white">
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
                        <SelectTrigger className="w-full border-[#c4c8d9] bg-white">
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
                        <SelectTrigger className="w-full border-[#c4c8d9] bg-white">
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
                        className="border-[#c4c8d9] bg-white"
                        value={data.property_type}
                        onChange={(event) =>
                            setData('property_type', event.target.value)
                        }
                        placeholder="Condo, house, land"
                    />
                </Field>
            </div>

            <div className="grid gap-5 px-6 md:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="space-y-4">
                    <Field label="Address" error={errors.address}>
                        <Input
                            className="border-[#c4c8d9] bg-white"
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
                                className="border-[#c4c8d9] bg-white"
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
                                className="border-[#c4c8d9] bg-white"
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
                                className="border-[#c4c8d9] bg-white"
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
                                className="border-[#c4c8d9] bg-white"
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
                            <div className="rounded-md border border-dashed border-[#c4c8d9] bg-white p-4">
                                <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-sm bg-[#eef1fb] px-4 text-center text-sm text-[#596071] hover:bg-[#e5e9f7]">
                                    <ImagePlus className="mb-3 size-8 text-blue-700" />
                                    <span className="font-medium text-[#1f2330]">
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
                                </label>
                                {data.images.length > 0 && (
                                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                        {data.images.map((image, index) => (
                                            <div
                                                key={`${image.name}-${index}`}
                                                className="flex items-center justify-between gap-2 rounded-sm border border-[#c4c8d9] px-3 py-2 text-sm text-[#303545]"
                                            >
                                                <span className="truncate">
                                                    {image.name}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeImage(index)
                                                    }
                                                    className="text-[#596071] hover:text-red-600"
                                                    aria-label={`Remove ${image.name}`}
                                                >
                                                    <X className="size-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="mt-3 text-xs text-[#596071]">
                                    If more than 3 files are selected, only the
                                    first 3 will be uploaded.
                                </div>
                            </div>
                        </Field>
                    )}
                </div>

                <div className="rounded-md border border-[#c4c8d9] bg-white p-4">
                    <div className="text-sm font-semibold text-[#1f2330]">
                        Listing setup
                    </div>
                    <dl className="mt-4 space-y-3 text-sm">
                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-[#596071]">Mode</dt>
                            <dd className="font-medium text-[#1f2330]">
                                {isEditing ? 'Edit' : 'Create'}
                            </dd>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-[#596071]">Agents</dt>
                            <dd className="font-medium text-[#1f2330]">
                                {agents.length}
                            </dd>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-[#596071]">Owners</dt>
                            <dd className="font-medium text-[#1f2330]">
                                {owners.length}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#c4c8d9] bg-[#f7f5fc] px-6 py-4">
                <Button
                    variant="outline"
                    asChild
                    className="rounded-sm border-[#c4c8d9] bg-white text-[#303545] hover:bg-[#eef1fb]"
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
                    className="rounded-sm bg-blue-700 text-white hover:bg-blue-800"
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
            <Label className="text-sm font-medium text-[#303545]">
                {label}
            </Label>
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
