<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Viewing;
use App\Services\OwnershipScope;

class ViewingPolicy
{
    public function __construct(private OwnershipScope $ownershipScope) {}

    public function viewAny(User $user): bool
    {
        return $user->hasPermission('viewing.read');
    }

    public function view(User $user, Viewing $viewing): bool
    {
        return $this->ownershipScope->canAccess($user, $viewing, 'viewing.read');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('viewing.create');
    }

    public function update(User $user, Viewing $viewing): bool
    {
        return $this->ownershipScope->canAccess($user, $viewing, 'viewing.update');
    }

    public function delete(User $user, Viewing $viewing): bool
    {
        return $this->ownershipScope->canAccess($user, $viewing, 'viewing.delete');
    }

    public function restore(User $user, Viewing $viewing): bool
    {
        return $this->ownershipScope->canAccess($user, $viewing, 'viewing.delete');
    }

    public function forceDelete(User $user, Viewing $viewing): bool
    {
        return false;
    }
}
