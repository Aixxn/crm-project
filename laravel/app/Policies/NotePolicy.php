<?php

namespace App\Policies;

use App\Models\Note;
use App\Models\User;
use App\Services\OwnershipScope;

class NotePolicy
{
    public function __construct(private OwnershipScope $ownershipScope) {}

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('note.read');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Note $note): bool
    {
        return $this->ownershipScope->canAccess($user, $note, 'note.read');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission('note.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Note $note): bool
    {
        return $this->ownershipScope->canAccess($user, $note, 'note.update');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Note $note): bool
    {
        return $this->ownershipScope->canAccess($user, $note, 'note.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Note $note): bool
    {
        return $this->ownershipScope->canAccess($user, $note, 'note.delete');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Note $note): bool
    {
        return false;
    }
}
