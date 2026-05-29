<?php

namespace App\Policies;

use App\Models\Listing;
use App\Models\User;
use App\Services\OwnershipScope;

class ListingPolicy
{
    public function __construct(private OwnershipScope $ownershipScope) {}

    public function viewAny(User $user): bool
    {
        return $user->hasPermission('listing.read');
    }

    public function view(User $user, Listing $listing): bool
    {
        return $this->ownershipScope->canAccess($user, $listing, 'listing.read');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('listing.create');
    }

    public function assignAgent(User $user, int $assignedAgentId): bool
    {
        return $user->hasRole('admin') || (int) $user->getKey() === $assignedAgentId;
    }

    public function update(User $user, Listing $listing): bool
    {
        return $this->ownershipScope->canAccess($user, $listing, 'listing.update');
    }

    public function delete(User $user, Listing $listing): bool
    {
        return $this->ownershipScope->canAccess($user, $listing, 'listing.delete');
    }

    public function restore(User $user, Listing $listing): bool
    {
        return $this->ownershipScope->canAccess($user, $listing, 'listing.delete');
    }

    public function forceDelete(User $user, Listing $listing): bool
    {
        return false;
    }
}
