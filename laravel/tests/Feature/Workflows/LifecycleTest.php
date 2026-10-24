<?php

namespace Tests\Feature\Workflows;

use App\Enums\ListingStatus;
use App\Enums\OfferStatus;
use App\Models\Listing;
use App\Models\Offer;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LifecycleTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Role::factory()->create(['key' => 'admin']));

        return $user;
    }

    public function test_generic_listing_edit_cannot_skip_to_closed(): void
    {
        $listing = Listing::factory()->active()->create();
        $this->actingAs($this->admin())->putJson(route('listings.update', $listing), $listing->only(['assigned_agent_id', 'owner_contact_id', 'address', 'property_type', 'price', 'bedrooms', 'bathrooms', 'area_sqft']) + ['status' => 'Closed'])->assertUnprocessable();
        $this->assertSame(ListingStatus::Active, $listing->refresh()->status);
    }

    public function test_offer_acceptance_updates_parent_and_persists_history_atomically(): void
    {
        $listing = Listing::factory()->active()->create();
        $offer = Offer::factory()->create(['listing_id' => $listing->id, 'status' => OfferStatus::Submitted]);
        $actor = $this->admin();
        $this->actingAs($actor)->putJson(route('offers.update', $offer), $offer->only(['listing_id', 'contact_id', 'amount', 'notes']) + ['status' => 'Accepted'])->assertOk();
        $this->assertSame(ListingStatus::UnderOffer, $listing->refresh()->status);
        $this->assertDatabaseHas('state_transitions', ['entity_id' => $offer->id, 'actor_id' => $actor->id, 'old_state' => 'Submitted', 'new_state' => 'Accepted']);
    }

    public function test_second_acceptance_and_closure_with_competing_submission_roll_back(): void
    {
        $listing = Listing::factory()->create(['status' => ListingStatus::UnderOffer]);
        Offer::factory()->create(['listing_id' => $listing->id, 'status' => OfferStatus::Accepted]);
        $other = Offer::factory()->create(['listing_id' => $listing->id, 'status' => OfferStatus::Submitted]);
        $this->actingAs($this->admin())->putJson(route('offers.update', $other), $other->only(['listing_id', 'contact_id', 'amount', 'notes']) + ['status' => 'Accepted'])->assertUnprocessable();
        $this->assertSame(OfferStatus::Submitted, $other->refresh()->status);
        $this->putJson(route('listings.update', $listing), $listing->only(['assigned_agent_id', 'owner_contact_id', 'address', 'property_type', 'price', 'bedrooms', 'bathrooms', 'area_sqft']) + ['status' => 'Closed'])->assertUnprocessable();
        $this->assertSame(ListingStatus::UnderOffer, $listing->refresh()->status);
    }
}
