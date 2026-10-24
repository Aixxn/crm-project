<?php

namespace App\Actions\Listings;

use App\Actions\Lifecycle\ChangeRecord;
use App\Enums\ContactRole;
use App\Models\Contact;
use App\Models\Listing;
use App\Models\User;
use App\Services\OwnershipScope;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class CreateListing
{
    public function __construct(private OwnershipScope $ownershipScope) {}

    /** @param array<string, mixed> $attributes */
    public function handle(User $user, array $attributes): Listing
    {
        return DB::transaction(function () use ($user, $attributes): Listing {
            Gate::forUser($user)->authorize('create', Listing::class);
            $agent = User::query()->lockForUpdate()->find($attributes['assigned_agent_id']);
            if (! $agent || ! $agent->hasCrmAccess() || ! Gate::forUser($user)->allows('assignAgent', [Listing::class, (int) $agent->id])) {
                throw ValidationException::withMessages(['assigned_agent_id' => 'Select an eligible assigned staff member.']);
            }

            $newContact = $attributes['new_owner'] ?? null;
            if ($newContact !== null && ! empty($attributes['owner_contact_id'])) {
                throw ValidationException::withMessages(['owner_contact_id' => 'Choose an existing contact or create a new contact.']);
            }
            if ($newContact !== null) {
                abort_unless($user->hasPermission('contact.create'), 403);
                $contact = Contact::query()->create([
                    'first_name' => $newContact['first_name'],
                    'last_name' => $newContact['last_name'] ?? null,
                    'email' => $newContact['email'] ?? null,
                    'phone' => $newContact['phone'] ?? null,
                    'role' => ContactRole::Owner,
                ]);
            } else {
                $contact = Contact::query()->lockForUpdate()->find($attributes['owner_contact_id'] ?? null);
                if (! $contact || ! $this->ownershipScope->canAccess($user, $contact, 'contact.read')) {
                    throw ValidationException::withMessages(['owner_contact_id' => 'Select an accessible contact.']);
                }
            }
            unset($attributes['new_owner']);
            $attributes['owner_contact_id'] = $contact->getKey();

            return app(ChangeRecord::class)->create($user, new Listing, $attributes, $newContact !== null ? $contact : null);
        });
    }
}
