<?php

namespace App\Actions\Lifecycle;

use App\Enums\ListingStatus;
use App\Enums\OfferStatus;
use App\Models\Contact;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\Offer;
use App\Models\Task;
use App\Models\User;
use App\Models\Viewing;
use App\Rules\OffsetDateTime;
use App\Services\OwnershipScope;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class ChangeRecord
{
    private const TRANSITIONS = [
        Listing::class => ['Draft' => ['Active', 'Closed Lost'], 'Active' => ['Under Offer', 'Closed Lost'], 'Under Offer' => ['Active', 'Closed', 'Closed Lost'], 'Closed' => [], 'Closed Lost' => []],
        Inquiry::class => ['New' => ['Contacted', 'Closed'], 'Contacted' => ['Qualified', 'Closed'], 'Qualified' => ['Converted', 'Closed'], 'Converted' => [], 'Closed' => []],
        Viewing::class => ['Requested' => ['Scheduled', 'Cancelled'], 'Scheduled' => ['Completed', 'No Show', 'Cancelled'], 'Completed' => [], 'No Show' => [], 'Cancelled' => []],
        Offer::class => ['Submitted' => ['Accepted', 'Rejected', 'Withdrawn'], 'Accepted' => ['Withdrawn'], 'Rejected' => [], 'Withdrawn' => []],
        Task::class => ['Open' => ['In Progress', 'Done'], 'In Progress' => ['Open', 'Done'], 'Done' => ['Open']],
    ];

    public function __construct(private OwnershipScope $scope, private RecordTransition $history) {}

    /** @param array<string, mixed> $attributes */
    public function create(User $actor, Listing|Inquiry|Offer|Viewing|Task $record, array $attributes, ?Contact $createdContact = null): Listing|Inquiry|Offer|Viewing|Task
    {
        $this->ensure(! $record->exists, 'status', 'Create requires a new record.');

        return $this->transact(function () use ($actor, $record, $attributes, $createdContact) {
            $record = $record->newInstance();
            Gate::forUser($actor)->authorize('create', $record::class);
            $initial = match ($record::class) {
                Listing::class => ['Draft'], Inquiry::class => ['New'], Offer::class => ['Submitted'], Viewing::class => ['Requested', 'Scheduled'], Task::class => ['Open'],
            };
            $this->ensure(in_array($attributes['status'] ?? null, $initial, true), 'status', 'Choose an initial state.');
            $listing = isset($attributes['listing_id']) ? Listing::query()->lockForUpdate()->find($attributes['listing_id']) : null;
            if ($record instanceof Inquiry || $record instanceof Offer || $record instanceof Viewing) {
                $this->checkRelations($actor, $record, $attributes, 'create', $createdContact);
                $this->ensure($listing && ! $this->closed($listing), 'listing_id', 'Closed listings do not admit new customer activity.');
            }
            if ($record instanceof Task) {
                $this->checkTask($actor, $attributes, 'create');
            }
            if ($record instanceof Listing) {
                $this->checkListing($actor, $record, $attributes, $createdContact);
            }
            if ($record instanceof Viewing) {
                $this->checkTime($attributes['scheduled_at']);
                $this->ensure(Carbon::parse($attributes['scheduled_at'])->isFuture(), 'scheduled_at', 'Choose a future viewing time.');
                $attributes['scheduled_at'] = Carbon::parse($attributes['scheduled_at'])->utc();
                $this->uniqueViewing($record, $attributes, $attributes['scheduled_at']->toDateTimeString(), $attributes['status']);
            }
            if ($record instanceof Offer) {
                $this->positiveAmount($attributes['amount']);
            }
            $record->fill($attributes)->save();
            $this->history->handle($actor, $record, null, operation: 'create');

            return $record;
        }, 3);
    }

    /** @param array<string, mixed> $attributes */
    public function update(User $actor, Listing|Inquiry|Offer|Viewing|Task $record, array $attributes): Listing|Inquiry|Offer|Viewing|Task
    {
        return $this->transact(function () use ($actor, $record, $attributes) {
            $record = $record->newQuery()->findOrFail($record->id);
            $oldParentId = $record->listing_id;
            $parentIds = $record instanceof Listing ? [$record->id] : array_filter([$record->listing_id, $attributes['listing_id'] ?? null]);
            $parents = Listing::query()->whereIn('id', array_unique($parentIds))->orderBy('id')->lockForUpdate()->get()->keyBy('id');
            $record = $record->newQuery()->lockForUpdate()->findOrFail($record->id);
            $this->ensure($record->listing_id === $oldParentId, 'listing_id', 'This activity moved while you were editing. Reload and retry.');
            Gate::forUser($actor)->authorize('update', $record);
            $old = $record->status->value;
            $next = $attributes['status'] ?? $old;
            $reason = trim($attributes['reason'] ?? '');
            $operation = $attributes['operation'] ?? 'transition';
            unset($attributes['reason'], $attributes['operation']);
            $this->ensure(in_array($operation, ['transition', 'correct', 'reopen'], true), 'operation', 'Choose a supported lifecycle operation.');
            $this->ensure($operation !== 'reopen' || $record instanceof Task && $old === 'Done' && $next === 'Open' && $reason !== '', 'operation', 'Reopen applies only to a completed task and requires a reason.');
            if ($record instanceof Viewing && isset($attributes['scheduled_at'])) {
                $this->checkTime($attributes['scheduled_at']);
                $attributes['scheduled_at'] = Carbon::parse($attributes['scheduled_at'])->utc();
            }
            $candidate = clone $record;
            $candidate->fill($attributes);
            if ($operation === 'transition' && ! $candidate->isDirty()) {
                return $record;
            }
            $terminal = self::TRANSITIONS[$record::class][$old] === [] || ($record instanceof Task && $old === 'Done');
            $listing = $record instanceof Listing ? $record : $parents->get($attributes['listing_id'] ?? $record->listing_id);
            $historical = $terminal || $record instanceof Offer && $listing && $this->closed($listing);
            if (! $record instanceof Listing && ! $record instanceof Task && ($attributes['listing_id'] ?? $record->listing_id) !== $record->listing_id) {
                $oldParent = $parents->get($record->listing_id);
                $this->ensure($oldParent && $listing && ! $this->closed($oldParent) && ! $this->closed($listing), 'listing_id', 'Activity cannot move to or from a closed listing.');
            }
            if ($operation === 'correct') {
                $this->ensure($actor->hasRole('admin') && $reason !== '', 'reason', 'Historical correction requires an administrator and a reason.');
                $this->ensure($next === $old, 'status', 'Corrections cannot change lifecycle state.');
                foreach (['listing_id', 'contact_id', 'agent_id', 'related_entity_id', 'related_entity_type'] as $identity) {
                    if (array_key_exists($identity, $attributes)) {
                        $value = (string) $attributes[$identity];
                        $current = (string) $record->$identity;
                        $this->ensure($value === $current, $identity, 'Historical correction cannot move or schedule activity.');
                    }
                }
            } else {
                $reopening = $record instanceof Task && $old === 'Done' && $next === 'Open';
                $this->ensure(! $historical || $reopening, 'reason', 'Use an explicit administrator correction with a reason for historical metadata.');
                if ($reopening) {
                    $this->ensure($operation === 'reopen' && $reason !== '', 'reason', 'Explicit reopening requires a reason.');
                }
                if ($next !== $old) {
                    $this->ensure(in_array($next, self::TRANSITIONS[$record::class][$old], true), 'status', 'This lifecycle transition is not allowed.');
                }
            }
            if ($record instanceof Inquiry || $record instanceof Offer || $record instanceof Viewing) {
                $this->checkRelations($actor, $record, $attributes, 'update');
                if ($next !== $old) {
                    $this->ensure(($attributes['listing_id'] ?? $record->listing_id) === $record->listing_id && ($attributes['contact_id'] ?? $record->contact_id) === $record->contact_id, 'listing_id', 'Move activity separately from a lifecycle decision.');
                }
            }
            if ($record instanceof Listing) {
                $this->checkListing($actor, $record, $attributes);
            }
            if ($record instanceof Task) {
                $this->checkTask($actor, $attributes + $record->getAttributes(), 'update');
            }
            if ($record instanceof Offer) {
                if ($next !== $old) {
                    $this->ensure($listing && ! $this->closed($listing), 'status', 'A closed listing does not admit offer decisions.');
                }
                $this->positiveAmount($attributes['amount'] ?? $record->amount);
                if ($old === 'Accepted') {
                    $this->ensure(($attributes['listing_id'] ?? $record->listing_id) === $record->listing_id && ($attributes['contact_id'] ?? $record->contact_id) === $record->contact_id, 'listing_id', 'Withdraw the accepted offer before moving it.');
                }
                if ($next === 'Accepted' && $old !== $next) {
                    $this->ensure($listing && in_array($listing->status, [ListingStatus::Active, ListingStatus::UnderOffer], true), 'status', 'Offers can only be accepted on Active or Under Offer listings.');
                    $this->ensure(! Offer::withTrashed()->where('listing_id', $listing->id)->where('status', OfferStatus::Accepted)->exists(), 'status', 'This listing already has an accepted offer.');
                }
            }
            if ($record instanceof Viewing) {
                $scheduled = Carbon::parse($attributes['scheduled_at'] ?? $record->scheduled_at)->utc();
                if ($operation !== 'correct' && ($scheduled->ne($record->scheduled_at) || $next === 'Scheduled' && $old !== $next)) {
                    $this->ensure($listing && ! $this->closed($listing) && $scheduled->isFuture(), 'scheduled_at', 'New scheduling requires a future time on an open listing.');
                }
                if ($operation !== 'correct' && in_array($old, ['Completed', 'No Show', 'Cancelled'], true)) {
                    $this->ensure($scheduled->eq($record->scheduled_at), 'scheduled_at', 'Terminal viewings cannot be rescheduled.');
                }
                if ($operation === 'correct' && in_array($old, ['Requested', 'Scheduled'], true)) {
                    $this->ensure($scheduled->eq($record->scheduled_at), 'scheduled_at', 'Correct historical outcomes separately from active scheduling.');
                }
                $this->uniqueViewing($record, $attributes, $scheduled->toDateTimeString(), $next);
                $attributes['scheduled_at'] = $scheduled;
            }
            if ($record instanceof Listing && $next !== $old) {
                $accepted = Offer::withTrashed()->where('listing_id', $record->id)->where('status', OfferStatus::Accepted)->count();
                if (in_array($next, ['Active', 'Closed Lost'], true)) {
                    $this->ensure($accepted === 0, 'status', 'Withdraw the accepted offer before leaving Under Offer.');
                }
                if ($next === 'Active') {
                    $this->ensure(Contact::query()->whereKey($attributes['owner_contact_id'] ?? $record->owner_contact_id)->exists(), 'owner_contact_id', 'Activation requires an available owner.');
                    $agent = User::query()->find($attributes['assigned_agent_id'] ?? $record->assigned_agent_id);
                    $this->ensure($agent && $agent->hasCrmAccess(), 'assigned_agent_id', 'Activation requires eligible staff.');
                    $this->ensure(trim($attributes['address'] ?? $record->address) !== '' && (float) ($attributes['price'] ?? $record->price) > 0, 'price', 'Activation requires an address and a positive price.');
                }
                if ($next === 'Closed') {
                    $this->ensure($accepted === 1 && ! Offer::withTrashed()->where('listing_id', $record->id)->where('status', OfferStatus::Submitted)->exists(), 'status', 'Closure requires one accepted offer and all submitted offers resolved.');
                    if ($record->closed_at === null) {
                        $record->closed_at = now()->utc();
                    }
                }
            }
            $record->fill($attributes)->save();
            if ($old !== $next || $operation === 'correct') {
                $this->history->handle($actor, $record, $old, $reason ?: null, $operation);
            }
            if ($record instanceof Offer && $old !== $next) {
                $parentNext = $next === 'Accepted' ? ListingStatus::UnderOffer : ($old === 'Accepted' && $listing->status === ListingStatus::UnderOffer ? ListingStatus::Active : null);
                if ($parentNext && $listing->status !== $parentNext) {
                    $parentOld = $listing->status->value;
                    $listing->status = $parentNext;
                    $listing->save();
                    $this->history->handle($actor, $listing, $parentOld, $reason ?: null);
                }
            }

            return $record;
        }, 3);
    }

    public function deleteOffer(User $actor, Offer $offer): void
    {
        DB::transaction(function () use ($actor, $offer): void {
            $snapshot = Offer::query()->findOrFail($offer->id);
            Listing::query()->whereKey($snapshot->listing_id)->lockForUpdate()->firstOrFail();
            $current = Offer::query()->lockForUpdate()->findOrFail($offer->id);
            $this->ensure($snapshot->listing_id === $current->listing_id, 'listing_id', 'This offer moved. Reload and retry.');
            Gate::forUser($actor)->authorize('delete', $current);
            $this->ensure(! in_array($current->status, [OfferStatus::Accepted, OfferStatus::Submitted], true), 'status', 'Resolve the offer by withdrawing or rejecting it before deletion.');
            $current->delete();
        }, 3);
    }

    /** @param array<string, mixed> $attributes */
    private function checkRelations(User $actor, Inquiry|Offer|Viewing $record, array $attributes, string $operation, ?Contact $createdContact = null): void
    {
        $listing = Listing::query()->find($attributes['listing_id'] ?? $record->listing_id);
        $contact = Contact::query()->find($attributes['contact_id'] ?? $record->contact_id);
        $resource = strtolower(class_basename($record));
        $this->ensure($listing && $this->scope->canAccess($actor, $listing, "$resource.$operation"), 'listing_id', 'Select an accessible listing.');
        $this->ensure($contact && ($this->scope->canAccess($actor, $contact, 'contact.read') || ($createdContact?->id === $contact->id && $actor->hasPermission('contact.create'))), 'contact_id', 'Select an accessible contact.');
        if ($record instanceof Viewing) {
            $agent = User::query()->find($attributes['agent_id'] ?? $record->agent_id);
            $this->ensure($agent && $agent->hasCrmAccess() && ($actor->hasRole('admin') || $agent->id === $actor->id), 'agent_id', 'Select eligible assigned staff.');
        }
    }

    /** @param array<string, mixed> $attributes */
    private function checkListing(User $actor, Listing $record, array $attributes, ?Contact $createdContact = null): void
    {
        $agentId = (int) ($attributes['assigned_agent_id'] ?? $record->assigned_agent_id);
        $agent = User::query()->find($agentId);
        $contact = Contact::query()->find($attributes['owner_contact_id'] ?? $record->owner_contact_id);
        $this->ensure($agent && $agent->hasCrmAccess() && Gate::forUser($actor)->allows('assignAgent', [Listing::class, $agentId]), 'assigned_agent_id', 'Select eligible assigned staff.');
        $this->ensure(! $record->exists || $actor->hasRole('admin') || $agentId === (int) $record->assigned_agent_id, 'assigned_agent_id', 'Only administrators can reassign listings.');
        $this->ensure($contact && ($this->scope->canAccess($actor, $contact, 'contact.read') || $createdContact?->id === $contact->id && $actor->hasPermission('contact.create')), 'owner_contact_id', 'Select an accessible owner.');
    }

    /** @param array<string, mixed> $attributes */
    private function checkTask(User $actor, array $attributes, string $operation): void
    {
        $parent = $this->scope->resolveParent($attributes['related_entity_type'], $attributes['related_entity_id']);
        $assignee = User::query()->find($attributes['assignee_id']);
        $this->ensure($parent && $this->scope->canAccess($actor, $parent, 'task.'.$operation), 'related_entity_id', 'Select an accessible parent.');
        $this->ensure($assignee && $assignee->hasCrmAccess() && ($actor->hasRole('admin') || $assignee->id === $actor->id), 'assignee_id', 'Select eligible assigned staff.');
    }

    private function checkTime(mixed $time): void
    {
        Validator::make(['scheduled_at' => $time], ['scheduled_at' => ['required', 'date', new OffsetDateTime]])->validate();
    }

    /** @param array<string, mixed> $attributes */
    private function uniqueViewing(Viewing $record, array $attributes, string $time, string $status): void
    {
        if (in_array($status, ['Requested', 'Scheduled'], true)) {
            $duplicate = Viewing::query()->where('listing_id', $attributes['listing_id'] ?? $record->listing_id)->where('contact_id', $attributes['contact_id'] ?? $record->contact_id)->where('scheduled_at', $time)->whereIn('status', ['Requested', 'Scheduled'])->when($record->exists, fn ($query) => $query->where('id', '!=', $record->id))->exists();
            $this->ensure(! $duplicate, 'scheduled_at', 'An active viewing already exists for this time.');
        }
    }

    private function transact(\Closure $operation, int $attempts = 3): Listing|Inquiry|Offer|Viewing|Task
    {
        try {
            return DB::transaction($operation, $attempts);
        } catch (UniqueConstraintViolationException $exception) {
            if (str_contains($exception->getMessage(), 'viewings')) {
                throw ValidationException::withMessages(['scheduled_at' => 'An active viewing already exists for this time.']);
            }
            if (str_contains($exception->getMessage(), 'offers')) {
                throw ValidationException::withMessages(['status' => 'This listing already has an accepted offer.']);
            }
            throw $exception;
        }
    }

    private function positiveAmount(mixed $amount): void
    {
        $this->ensure(is_numeric($amount) && (float) $amount > 0 && preg_match('/^\d+(?:\.\d{1,2})?$/', (string) $amount), 'amount', 'Enter a positive decimal amount with at most two decimal places.');
    }

    private function closed(Listing $listing): bool
    {
        return in_array($listing->status, [ListingStatus::Closed, ListingStatus::ClosedLost], true);
    }

    private function ensure(bool $condition, string $field, string $message): void
    {
        if (! $condition) {
            throw ValidationException::withMessages([$field => $message]);
        }
    }
}
