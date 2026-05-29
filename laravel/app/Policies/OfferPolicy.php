<?php

namespace App\Policies;

use App\Models\Offer;
use App\Models\User;
use App\Services\OwnershipScope;

class OfferPolicy
{
    public function __construct(private OwnershipScope $ownershipScope) {}

    public function viewAny(User $user): bool
    {
        return $user->hasPermission('offer.read');
    }

    public function view(User $user, Offer $offer): bool
    {
        return $this->ownershipScope->canAccess($user, $offer, 'offer.read');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('offer.create');
    }

    public function update(User $user, Offer $offer): bool
    {
        return $this->ownershipScope->canAccess($user, $offer, 'offer.update');
    }

    public function delete(User $user, Offer $offer): bool
    {
        return $this->ownershipScope->canAccess($user, $offer, 'offer.delete');
    }

    public function restore(User $user, Offer $offer): bool
    {
        return $this->ownershipScope->canAccess($user, $offer, 'offer.delete');
    }

    public function forceDelete(User $user, Offer $offer): bool
    {
        return false;
    }
}
