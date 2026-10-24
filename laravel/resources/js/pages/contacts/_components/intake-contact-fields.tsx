import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { NewContactInput } from '../types';

type Props = {
    prefix: 'new_owner' | 'new_contact';
    value: NewContactInput | null;
    onChange: (value: NewContactInput | null) => void;
    errors: Partial<Record<string, string>>;
    disabled: boolean;
};

const fields = [
    { key: 'first_name', label: 'First name', type: 'text', required: true },
    { key: 'last_name', label: 'Last name', type: 'text', required: false },
    { key: 'email', label: 'Email', type: 'email', required: false },
    { key: 'phone', label: 'Phone', type: 'tel', required: false },
] satisfies {
    key: keyof NewContactInput;
    label: string;
    type: string;
    required: boolean;
}[];

export function IntakeContactFields({
    prefix,
    value,
    onChange,
    errors,
    disabled,
}: Props) {
    return (
        <section className="space-y-4 rounded-md border border-border bg-card p-4 text-card-foreground">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                    {value
                        ? 'The new contact will be saved with this record.'
                        : 'Choose an existing contact above, or add a new person.'}
                </p>
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    onClick={() =>
                        onChange(
                            value
                                ? null
                                : {
                                      first_name: '',
                                      last_name: '',
                                      email: '',
                                      phone: '',
                                  },
                        )
                    }
                >
                    {value ? 'Use existing contact' : 'Create new contact'}
                </Button>
            </div>
            {errors[prefix] && (
                <p role="alert" className="text-sm text-destructive">
                    {errors[prefix]}
                </p>
            )}
            {value && (
                <div className="grid gap-4 sm:grid-cols-2">
                    {fields.map(({ key, label, type, required }) => {
                        const id = `${prefix}.${key}`;

                        return (
                            <div key={key} className="space-y-2">
                                <Label htmlFor={id}>
                                    {label}
                                    {required ? ' (required)' : ' (optional)'}
                                </Label>
                                <Input
                                    id={id}
                                    type={type}
                                    required={required}
                                    disabled={disabled}
                                    value={value[key]}
                                    onChange={(event) =>
                                        onChange({
                                            ...value,
                                            [key]: event.target.value,
                                        })
                                    }
                                    aria-invalid={Boolean(errors[id])}
                                    aria-describedby={
                                        errors[id] ? `${id}-error` : undefined
                                    }
                                />
                                {errors[id] && (
                                    <p
                                        id={`${id}-error`}
                                        role="alert"
                                        className="text-sm text-destructive"
                                    >
                                        {errors[id]}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
