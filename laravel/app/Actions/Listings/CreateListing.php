<?php

namespace App\Actions\Listings;

use App\Actions\Lifecycle\ChangeRecord;
use App\Enums\ContactRole;
use App\Models\Contact;
use App\Models\Listing;
use App\Models\ListingMedia;
use App\Models\User;
use App\Services\OwnershipScope;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class CreateListing
{
    public function __construct(private OwnershipScope $ownershipScope) {}

    /** @param array<string, mixed> $attributes */
    public function handle(User $user, array $attributes): Listing
    {
        $images = $attributes['images'] ?? [];
        unset($attributes['images']);
        $staged = [];
        $promoted = [];
        $compensated = false;
        $cleanup = function () use (&$staged, &$promoted, &$compensated): void {
            if ($compensated) {
                return;
            }
            $compensated = true;
            $this->removeFiles('local', $staged);
            $this->removeFiles('public', $promoted);
        };
        if (DB::transactionLevel() > 0) {
            // Committed savepoint callbacks are discarded by a later ancestor rollback.
            foreach (app('db.transactions')->getPendingTransactions() as $transaction) {
                if ($transaction->connection === DB::connection()->getName()) {
                    $transaction->addCallbackForRollback($cleanup);
                }
            }
        }

        try {
            foreach ($images as $image) {
                $path = 'listing-staging/'.Str::uuid().'.'.$image->extension();
                $staged[] = $path;
                if (Storage::disk('local')->putFileAs(dirname($path), $image, basename($path)) === false) {
                    throw new RuntimeException('Unable to stage listing image.');
                }
            }

            $listing = DB::transaction(function () use ($user, $attributes, &$staged, &$promoted): Listing {
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

                $listing = app(ChangeRecord::class)->create($user, new Listing, $attributes, $newContact !== null ? $contact : null);
                foreach ($staged as $index => $source) {
                    $destination = 'listings/'.$listing->getKey().'/'.basename($source);
                    $promoted[] = $destination;
                    $stream = Storage::disk('local')->readStream($source);
                    if (! is_resource($stream)) {
                        throw new RuntimeException('Unable to read staged listing image.');
                    }
                    try {
                        if (! Storage::disk('public')->put($destination, $stream)) {
                            throw new RuntimeException('Unable to publish listing image.');
                        }
                    } finally {
                        fclose($stream);
                    }
                    ListingMedia::query()->create([
                        'listing_id' => $listing->getKey(),
                        'url' => Storage::disk('public')->url($destination),
                        'type' => 'photo',
                        'sort_order' => $index,
                    ]);
                }

                return $listing;
            }, 1);
        } catch (Throwable $error) {
            $cleanup();
            throw $error;
        }
        $this->removeFiles('local', $staged);

        return $listing;
    }

    /** @param list<string> $paths */
    private function removeFiles(string $disk, array $paths): void
    {
        foreach ($paths as $path) {
            try {
                $removed = Storage::disk($disk)->delete($path);
            } catch (Throwable) {
                $removed = false;
            }
            if (! $removed) {
                $context = ['disk' => $disk, 'path' => $path, 'operation' => 'delete'];
                try {
                    Log::error('Listing media cleanup failed.', $context);
                } catch (Throwable) {
                    try {
                        error_log('Listing media cleanup failed. '.json_encode($context));
                    } catch (Throwable) {
                        // Compensation must not interrupt database rollback bookkeeping.
                    }
                }
            }
        }
    }
}
