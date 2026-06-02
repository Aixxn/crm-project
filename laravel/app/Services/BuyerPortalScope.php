<?php

namespace App\Services;

use App\Enums\ContactRole;
use App\Models\Contact;
use App\Models\User;

class BuyerPortalScope
{
    public function ensureContact(User $user): Contact
    {
        if ($user->contact_id !== null) {
            return $user->contact()->firstOrFail();
        }

        [$firstName, $lastName] = $this->splitName($user->name);

        $contact = Contact::withTrashed()
            ->where('role', ContactRole::Buyer)
            ->where('email', $user->email)
            ->first();

        if ($contact instanceof Contact) {
            if ($contact->trashed()) {
                $contact->restore();
            }

            $contact->update([
                'first_name' => $contact->first_name ?: $firstName,
                'last_name' => $contact->last_name ?: $lastName,
            ]);
        } else {
            $contact = Contact::create([
                'role' => ContactRole::Buyer,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $user->email,
            ]);
        }

        $user->forceFill(['contact_id' => $contact->getKey()])->save();

        return $contact;
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
