<?php

namespace App\Actions\Identity;

use App\Enums\ContactRole;
use App\Models\Contact;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

class RepairPortalContact
{
    public function handle(int $actorId, int $userId, ?string $contactId = null): Contact
    {
        try {
            return DB::transaction(function () use ($actorId, $userId, $contactId): Contact {
                $actor = User::query()->lockForUpdate()->find($actorId);
                abort_unless($actor?->hasRole('admin'), 403, 'An administrator is required.');

                $user = User::query()->lockForUpdate()->find($userId);
                abort_unless($user?->hasVerifiedEmail(), 409, 'A verified account is required.');

                if ($user->contact_id !== null) {
                    abort_if($contactId !== null && $contactId !== $user->contact_id, 409, 'The account already has a different association.');
                    $contact = Contact::query()->lockForUpdate()->find($user->contact_id);
                    abort_unless($contact, 409, 'The existing association needs review.');

                    return $contact;
                }

                if ($contactId !== null) {
                    $contact = Contact::query()->lockForUpdate()->find($contactId);
                    abort_unless($contact, 409, 'The requested contact is unavailable.');
                    abort_if(User::query()->where('contact_id', $contactId)->exists(), 409, 'The requested contact is unavailable.');
                } else {
                    $parts = preg_split('/\s+/', trim($user->name), 2) ?: [];
                    $contact = Contact::create([
                        'role' => ContactRole::Buyer,
                        'first_name' => $parts[0] ?? 'Buyer',
                        'last_name' => $parts[1] ?? null,
                        'email' => $user->email,
                    ]);
                }

                $user->forceFill(['contact_id' => $contact->getKey()])->save();

                return $contact;
            }, 3);
        } catch (UniqueConstraintViolationException) {
            abort(409, 'The requested association conflicts with an existing account.');
        }
    }
}
