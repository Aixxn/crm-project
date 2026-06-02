<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Enums\ContactRole;
use App\Models\Contact;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ])->validate();

        $user = User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => $input['password'],
        ]);

        [$firstName, $lastName] = $this->splitName($input['name']);

        $contact = Contact::create([
            'role' => ContactRole::Buyer,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $input['email'],
        ]);

        $user->forceFill(['contact_id' => $contact->getKey()])->save();

        return $user;
    }

    /**
     * @return array{0: string, 1: string|null}
     */
    private function splitName(string $name): array
    {
        $parts = preg_split('/\s+/', trim($name), 2) ?: [];

        return [
            $parts[0] ?? 'Buyer',
            $parts[1] ?? null,
        ];
    }
}
