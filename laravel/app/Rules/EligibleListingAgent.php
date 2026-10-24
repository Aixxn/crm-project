<?php

namespace App\Rules;

use App\Models\User;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class EligibleListingAgent implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $agent = is_scalar($value) ? User::query()->find($value) : null;
        if (! $agent || ! $agent->hasCrmAccess()) {
            $fail('Select an eligible staff member.');
        }
    }
}
