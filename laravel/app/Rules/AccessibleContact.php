<?php

namespace App\Rules;

use App\Models\Contact;
use App\Models\User;
use App\Services\OwnershipScope;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class AccessibleContact implements ValidationRule
{
    public function __construct(private User $user) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $contact = is_string($value) ? Contact::query()->find($value) : null;
        if (! $contact || ! app(OwnershipScope::class)->canAccess($this->user, $contact, 'contact.read')) {
            $fail('Select an accessible contact.');
        }
    }
}
