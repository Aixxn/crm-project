import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import contacts from '@/routes/contacts';

interface ContactCardProps {
    contact: {
        id: number;
        name: string;
        email: string;
        phone: string;
        company: string;
        avatar?: string;
    };
}

export default function ContactCard({ contact }: ContactCardProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
    });

    const handleUpdate = (e: FormEvent) => {
        e.preventDefault();
        post(contacts.update.form.put(contact.id).action);
    };

    return (
        <div className="overflow-hidden rounded-xl bg-white shadow-md dark:bg-gray-800">
            <div className="flex items-center space-x-4 border-b p-6 dark:border-gray-700">
                {contact.avatar ? (
                    <img
                        src={contact.avatar}
                        alt={`${contact.name}'s avatar`}
                        className="h-12 w-12 rounded-full object-cover"
                    />
                ) : (
                    <div className="rounded-flex h-12 w-12 items-center justify-center bg-primary/20">
                        <span className="font-semibold text-primary">
                            {contact.name.charAt(0)}
                        </span>
                    </div>
                )}
                <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {contact.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {contact.company}
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="ml-4"
                    onClick={() =>
                        setData({
                            name: contact.name,
                            email: contact.email,
                            phone: contact.phone,
                            company: contact.company,
                        })
                    }
                >
                    Edit
                </Button>
            </div>

            <div className="space-y-4 p-6">
                <div className="text-sm">
                    <p className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                        </svg>
                        <span>{contact.email}</span>
                    </p>
                    <p className="mt-2 flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.489 4.246a1 1 0 01-.5.866l-2.5.5a1 1 0 01-.948-.296l-.5-2.5a2 2 0 01.28-1.99l2.002-.115zm-2 14l2.5-2.5a2 2 0 001.415-.586l1.286-1.286a2 2 0 00.586-1.415l2.5-2.5A2 2 0 0015.415 3h-6.828a2 2 0 00-1.415.586l-1.286 1.286a2 2 0 00-.586 1.415l-2.5 2.5A2 2 0 003 17.414V19a2 2 0 002 2h6a2 2 0 002-2v-2.586z"
                            />
                        </svg>
                        <span>{contact.phone}</span>
                    </p>
                </div>

                <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Name
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                            placeholder="Enter name"
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email
                        </label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                            placeholder="Enter email"
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Phone
                        </label>
                        <input
                            type="tel"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                            placeholder="Enter phone"
                        />
                        {errors.phone && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {errors.phone}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Company
                        </label>
                        <input
                            type="text"
                            value={data.company}
                            onChange={(e) => setData('company', e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                            placeholder="Enter company"
                        />
                        {errors.company && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {errors.company}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3">
                        <Button
                            variant="secondary"
                            type="button"
                            onClick={() => {
                                reset();
                            }}
                            className="px-4"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="px-4"
                        >
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
