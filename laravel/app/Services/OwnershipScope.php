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
use Illuminate\Database\Eloquent\Model;

class OwnershipScope
{
    public function canAccess(User $user, Model $entity, ?string $permissionKey = null): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if ($permissionKey !== null && ! $user->hasPermission($permissionKey)) {
            return false;
        }

        if ($entity instanceof Contact) {
            return $this->contactIsLinkedToAssignedListing($user, $entity);
        }

        $listing = $this->resolveListing($entity);

        return $listing instanceof Listing
            && (int) $listing->assigned_agent_id === (int) $user->getKey();
    }

    private function resolveListing(Model $entity): ?Listing
    {
        return match (true) {
            $entity instanceof Listing => $entity,
            $entity instanceof Inquiry,
            $entity instanceof Viewing,
            $entity instanceof Offer => $entity->listing,
            $entity instanceof Task,
            $entity instanceof Note => $this->resolveRelatedEntityListing($entity),
            default => null,
        };
    }

    private function resolveRelatedEntityListing(Task|Note $entity): ?Listing
    {
        $relatedEntity = $entity->relatedEntity;

        return $relatedEntity instanceof Model
            ? $this->resolveListing($relatedEntity)
            : null;
    }

    private function contactIsLinkedToAssignedListing(User $user, Contact $contact): bool
    {
        return $contact->ownedListings()->where('assigned_agent_id', $user->getKey())->exists()
            || $contact->inquiries()->whereHas('listing', fn ($query) => $query->where('assigned_agent_id', $user->getKey()))->exists()
            || $contact->viewings()->whereHas('listing', fn ($query) => $query->where('assigned_agent_id', $user->getKey()))->exists()
            || $contact->offers()->whereHas('listing', fn ($query) => $query->where('assigned_agent_id', $user->getKey()))->exists();
    }
}
