<?php

namespace App\Actions\Inquiries;

use App\Actions\Lifecycle\ChangeRecord;
use App\Enums\ContactRole;
use App\Models\Contact;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\User;
use App\Services\OwnershipScope;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class CreateInquiry
{
    public function __construct(private OwnershipScope $ownershipScope) {}

    /** @param array<string, mixed> $attributes */
    public function handle(User $user, array $attributes): Inquiry
    {
        return DB::transaction(function () use ($user, $attributes): Inquiry {
            Gate::forUser($user)->authorize('create', Inquiry::class);
            $listing = Listing::query()->lockForUpdate()->find($attributes['listing_id']);
            if (! $listing || ! $this->ownershipScope->canAccess($user, $listing, 'inquiry.create')) {
                throw ValidationException::withMessages(['listing_id' => 'Select an accessible listing.']);
            }

            $newContact = $attributes['new_contact'] ?? null;
            if ($newContact !== null && ! empty($attributes['contact_id'])) {
                throw ValidationException::withMessages(['contact_id' => 'Choose an existing contact or create a new contact.']);
            }
            if ($newContact !== null) {
                abort_unless($user->hasPermission('contact.create'), 403);
                $contact = Contact::query()->create([
                    'first_name' => $newContact['first_name'],
                    'last_name' => $newContact['last_name'] ?? null,
                    'email' => $newContact['email'] ?? null,
                    'phone' => $newContact['phone'] ?? null,
                    'role' => ContactRole::Buyer,
                ]);
            } else {
                $contact = Contact::query()->lockForUpdate()->find($attributes['contact_id'] ?? null);
                if (! $contact || ! $this->ownershipScope->canAccess($user, $contact, 'contact.read')) {
                    throw ValidationException::withMessages(['contact_id' => 'Select an accessible contact.']);
                }
            }
            unset($attributes['new_contact']);
            $attributes['contact_id'] = $contact->getKey();

            return app(ChangeRecord::class)->create($user, new Inquiry, $attributes, $newContact !== null ? $contact : null);
        });
    }
}
