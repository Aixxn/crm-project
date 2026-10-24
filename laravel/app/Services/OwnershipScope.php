<?php

namespace App\Services;

use App\Models\Contact;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\Note;
use App\Models\Offer;
use App\Models\Task;
use App\Models\User;
use App\Models\Viewing;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class OwnershipScope
{
    public const RESOURCES = [
        Listing::class => 'listing', Contact::class => 'contact', Inquiry::class => 'inquiry',
        Viewing::class => 'viewing', Offer::class => 'offer', Task::class => 'task', Note::class => 'note',
    ];

    public const PARENTS = [Listing::class, Inquiry::class, Offer::class, Contact::class];

    public function scope(User $user, Builder $query, ?string $permissionKey = null): Builder
    {
        $model = $query->getModel();
        if (! $user->hasCrmAccess() || ! isset(self::RESOURCES[$model::class])) {
            return $query->whereRaw('1 = 0');
        }
        if (! $user->hasRole('admin') && $permissionKey !== null && ! $user->hasPermission($permissionKey)) {
            return $query->whereRaw('1 = 0');
        }
        if ($model instanceof Task || $model instanceof Note) {
            return $query->where(function (Builder $parents) use ($user): void {
                foreach (self::PARENTS as $type) {
                    $parents->orWhere(fn (Builder $parent) => $parent
                        ->where('related_entity_type', $type)
                        ->whereIn('related_entity_id', $this->scope($user, $type::query())->select('id')));
                }
            });
        }
        if ($model instanceof Inquiry || $model instanceof Viewing || $model instanceof Offer) {
            return $query->whereHas('listing', fn (Builder $listing) => $this->scope($user, $listing));
        }
        if ($user->hasRole('admin')) {
            return $query;
        }
        if ($model instanceof Listing) {
            return $query->where('assigned_agent_id', $user->getKey());
        }

        return $query->where(function (Builder $contact) use ($user): void {
            $contact->whereHas('ownedListings', fn (Builder $listing) => $this->scope($user, $listing));
            foreach (['inquiries', 'viewings', 'offers'] as $relation) {
                $contact->orWhereHas($relation.'.listing', fn (Builder $listing) => $this->scope($user, $listing));
            }
        });
    }

    public function canAccess(User $user, Model $entity, ?string $permissionKey = null): bool
    {
        return $this->scope($user, $entity->newQuery(), $permissionKey)->whereKey($entity->getKey())->exists();
    }

    public function resolveParent(string $type, string $id): Contact|Inquiry|Listing|Offer|null
    {
        return in_array($type, self::PARENTS, true) ? $type::query()->find($id) : null;
    }

    public function canEditContact(User $user, Contact $contact): bool
    {
        if (! $this->canAccess($user, $contact, 'contact.update')) {
            return false;
        }
        if ($user->hasRole('admin')) {
            return true;
        }
        $otherAssignment = fn (Builder $listing) => $listing->where(fn (Builder $query) => $query
            ->whereNull('assigned_agent_id')->orWhere('assigned_agent_id', '!=', $user->getKey()));

        return ! Contact::query()->whereKey($contact->getKey())->where(function (Builder $query) use ($otherAssignment): void {
            $query->whereHas('ownedListings', $otherAssignment);
            foreach (['inquiries', 'viewings', 'offers'] as $relation) {
                $query->orWhereHas($relation.'.listing', $otherAssignment);
            }
        })->exists();
    }

    public function readRelation(User $user): \Closure
    {
        return function ($relation) use ($user): void {
            if ($relation instanceof MorphTo) {
                $relation->constrain(array_combine(self::PARENTS, array_map(
                    fn (string $type) => fn (Builder $query) => $this->scope($user, $query, self::RESOURCES[$type].'.read'),
                    self::PARENTS,
                )));

                return;
            }
            $query = $relation instanceof Builder ? $relation : $relation->getQuery();
            $key = self::RESOURCES[$query->getModel()::class] ?? null;
            if ($key !== null) {
                $this->scope($user, $query, $key.'.read');
            }
        };
    }

    public function loadContactActivity(User $user, Contact $contact): Contact
    {
        return $contact->load(array_fill_keys([
            'ownedListings', 'inquiries', 'inquiries.listing', 'viewings', 'viewings.listing', 'offers', 'offers.listing',
        ], $this->readRelation($user)));
    }

    public function loadListingActivity(User $user, Listing $listing): Listing
    {
        return $listing->load([
            'assignedAgent:id,name,email', 'media',
            ...array_fill_keys(['owner', 'inquiries', 'inquiries.contact', 'viewings', 'viewings.contact', 'offers', 'offers.contact', 'tasks', 'notes'], $this->readRelation($user)),
            'viewings.agent:id,name,email', 'tasks.assignee:id,name,email', 'notes.author:id,name,email',
        ]);
    }
}
