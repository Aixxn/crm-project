<?php

namespace App\Policies;

use App\Models\Inquiry;
use App\Models\User;
use App\Services\OwnershipScope;

class InquiryPolicy
{
    public function __construct(private OwnershipScope $ownershipScope) {}

    public function viewAny(User $user): bool
    {
        return $user->hasPermission('inquiry.read');
    }

    public function view(User $user, Inquiry $inquiry): bool
    {
        return $this->ownershipScope->canAccess($user, $inquiry, 'inquiry.read');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('inquiry.create');
    }

    public function update(User $user, Inquiry $inquiry): bool
    {
        return $this->ownershipScope->canAccess($user, $inquiry, 'inquiry.update');
    }

    public function delete(User $user, Inquiry $inquiry): bool
    {
        return $this->ownershipScope->canAccess($user, $inquiry, 'inquiry.delete');
    }

    public function restore(User $user, Inquiry $inquiry): bool
    {
        return $this->ownershipScope->canAccess($user, $inquiry, 'inquiry.delete');
    }

    public function forceDelete(User $user, Inquiry $inquiry): bool
    {
        return false;
    }
}
