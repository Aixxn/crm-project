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
import contacts from '@/routes/contacts';
import type { ContactFormData, ContactRole, ContactSummary } from '../types';

const contactRoles: ContactRole[] = ['Owner', 'Buyer', 'Tenant'];

type ContactFormProps = {
    contact?: ContactSummary;
};

export function ContactForm({ contact }: ContactFormProps) {
    const { data, setData, post, processing, errors } =
        useForm<ContactFormData>({
            role: contact?.role ?? 'Buyer',
            first_name: contact?.first_name ?? '',
            last_name: contact?.last_name ?? '',
            email: contact?.email ?? '',
            phone: contact?.phone ?? '',
            notes: contact?.notes ?? '',
        });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (contact) {
            post(contacts.update.form.put(contact).action);

            return;
        }

        post(contacts.store.form().action);
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid gap-4 border-b border-[#C3C6D7]/70 bg-white px-4 py-5 md:grid-cols-3 md:px-6">
                <Field label="Role" error={errors.role}>
                    <Select
                        value={data.role}
                        onValueChange={(value) =>
                            setData('role', value as ContactRole)
                        }
                    >
                        <SelectTrigger className="w-full bg-white">
                            <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                            {contactRoles.map((role) => (
                                <SelectItem key={role} value={role}>
                                    {role}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>

                <Field label="First name" error={errors.first_name}>
                    <Input
                        value={data.first_name}
                        onChange={(event) =>
                            setData('first_name', event.target.value)
                        }
                        placeholder="Alex"
                    />
                </Field>

                <Field label="Last name" error={errors.last_name}>
                    <Input
                        value={data.last_name}
                        onChange={(event) =>
                            setData('last_name', event.target.value)
                        }
                        placeholder="Morgan"
                    />
                </Field>
            </div>

            <div className="grid gap-5 px-4 md:grid-cols-[minmax(0,1fr)_18rem] md:px-6">
                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Email" error={errors.email}>
                            <Input
                                type="email"
                                value={data.email}
                                onChange={(event) =>
                                    setData('email', event.target.value)
                                }
                                placeholder="alex@example.com"
                            />
                        </Field>

                        <Field label="Phone" error={errors.phone}>
                            <Input
                                value={data.phone}
                                onChange={(event) =>
                                    setData('phone', event.target.value)
                                }
                                placeholder="+1 555 555 0100"
                            />
                        </Field>
                    </div>

                    <Field label="Notes" error={errors.notes}>
                        <textarea
                            value={data.notes}
                            onChange={(event) =>
                                setData('notes', event.target.value)
                            }
                            className="min-h-36 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40"
                            placeholder="Budget, preferences, relationship context, or follow-up notes."
                        />
                    </Field>
                </div>

                <div className="rounded-md border border-[#C3C6D7] bg-white p-4">
                    <div className="text-sm font-medium text-neutral-950">
                        Contact state
                    </div>
                    <dl className="mt-4 space-y-3 text-sm">
                        <SummaryRow
                            label="Mode"
                            value={contact ? 'Edit' : 'Create'}
                        />
                        <SummaryRow label="Role" value={data.role} />
                        <SummaryRow
                            label="Name"
                            value={
                                `${data.first_name} ${data.last_name}`.trim() ||
                                '-'
                            }
                        />
                    </dl>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#C3C6D7]/70 bg-white px-4 py-4 md:px-6">
                <Button variant="outline" asChild>
                    <Link
                        href={
                            contact ? contacts.show(contact) : contacts.index()
                        }
                    >
                        <ArrowLeft />
                        Cancel
                    </Link>
                </Button>
                <Button type="submit" disabled={processing}>
                    <Save />
                    {processing ? 'Saving' : 'Save contact'}
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

function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <dt className="text-neutral-500">{label}</dt>
            <dd className="text-right font-medium text-neutral-900">{value}</dd>
        </div>
    );
}
