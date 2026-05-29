<?php

namespace App\Policies;

use App\Models\Contact;
use App\Models\User;
use App\Services\OwnershipScope;

class ContactPolicy
{
    public function __construct(private OwnershipScope $ownershipScope) {}

    public function viewAny(User $user): bool
    {
        return $user->hasPermission('contact.read');
    }

    public function view(User $user, Contact $contact): bool
    {
        return $this->ownershipScope->canAccess($user, $contact, 'contact.read');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('contact.create');
    }

    public function update(User $user, Contact $contact): bool
    {
        return $this->ownershipScope->canAccess($user, $contact, 'contact.update');
    }

    public function delete(User $user, Contact $contact): bool
    {
        return $this->ownershipScope->canAccess($user, $contact, 'contact.delete');
    }

    public function restore(User $user, Contact $contact): bool
    {
        return $this->ownershipScope->canAccess($user, $contact, 'contact.delete');
    }

    public function forceDelete(User $user, Contact $contact): bool
    {
        return false;
    }
}
