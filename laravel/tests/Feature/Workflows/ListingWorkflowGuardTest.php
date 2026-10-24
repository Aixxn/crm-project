<?php

namespace Tests\Feature\Workflows;

use App\Enums\ListingStatus;
use App\Enums\OfferStatus;
use App\Enums\ViewingStatus;
use App\Models\Listing;
use App\Models\Offer;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ListingWorkflowGuardTest extends TestCase
{
    use RefreshDatabase;

    public function test_viewing_cannot_be_created_for_closed_listing(): void
    {
        $agent = $this->userWithPermissions(['viewing.create', 'contact.read']);
        $listing = Listing::factory()->create([
            'assigned_agent_id' => $agent->id,
            'status' => ListingStatus::Closed,
        ]);
        $contact = $listing->owner;

        $this->actingAs($agent)
            ->postJson(route('viewings.store'), [
                'listing_id' => $listing->id,
                'contact_id' => $contact->id,
                'agent_id' => $agent->id,
                'status' => ViewingStatus::Scheduled->value,
                'scheduled_at' => now()->addDay()->toISOString(),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('listing_id');
    }

    public function test_listing_cannot_be_closed_with_submitted_offers(): void
    {
        $agent = $this->userWithPermissions(['listing.update', 'contact.read']);
        $listing = Listing::factory()->create([
            'assigned_agent_id' => $agent->id,
            'status' => ListingStatus::Active,
        ]);
        Offer::factory()->create([
            'listing_id' => $listing->id,
            'status' => OfferStatus::Submitted,
        ]);

        $this->actingAs($agent)
            ->putJson(route('listings.update', $listing), [
                'assigned_agent_id' => $agent->id,
                'owner_contact_id' => $listing->owner_contact_id,
                'status' => ListingStatus::Closed->value,
                'address' => $listing->address,
                'property_type' => $listing->property_type,
                'price' => $listing->price,
                'bedrooms' => $listing->bedrooms,
                'bathrooms' => $listing->bathrooms,
                'area_sqft' => $listing->area_sqft,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');
    }

    private function userWithPermissions(array $permissionKeys): User
    {
        $user = User::factory()->create();
        $role = Role::factory()->create(['key' => 'agent-'.Role::count()]);

        foreach ($permissionKeys as $permissionKey) {
            $role->addPermission(Permission::factory()->create(['key' => $permissionKey]));
        }

        $user->assignRole($role);

        return $user;
    }
}
