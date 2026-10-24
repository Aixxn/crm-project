<?php

namespace Tests\Feature\Workflows;

use App\Enums\OfferStatus;
use App\Models\Contact;
use App\Models\Listing;
use App\Models\Offer;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class OfferCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_agent_can_create_offer_for_assigned_listing(): void
    {
        $agent = $this->userWithPermissions(['offer.create', 'contact.read']);
        $listing = Listing::factory()->create(['assigned_agent_id' => $agent->id]);
        $contact = $listing->owner;

        $response = $this->actingAs($agent)->postJson(route('offers.store'), $this->payload($listing, $contact));

        $response->assertCreated()
            ->assertJsonPath('offer.listing_id', $listing->id);
    }

    public function test_agent_index_is_scoped_to_assigned_listing_offers(): void
    {
        $agent = $this->userWithPermissions(['offer.read']);
        $visible = Offer::factory()->create([
            'listing_id' => Listing::factory()->create(['assigned_agent_id' => $agent->id])->id,
        ]);
        $hidden = Offer::factory()->create();

        $response = $this->actingAs($agent)->getJson(route('offers.index'));

        $response->assertOk()
            ->assertJsonFragment(['id' => $visible->id])
            ->assertJsonMissing(['id' => $hidden->id]);
    }

    public function test_agent_can_update_and_delete_assigned_listing_offer(): void
    {
        $agent = $this->userWithPermissions(['offer.read', 'offer.update', 'offer.delete', 'contact.read']);
        $listing = Listing::factory()->active()->create(['assigned_agent_id' => $agent->id]);
        $contact = $listing->owner;
        $offer = Offer::factory()->create(['listing_id' => $listing->id, 'contact_id' => $contact->id]);

        $this->actingAs($agent)->getJson(route('offers.show', $offer))->assertOk();

        $this->actingAs($agent)
            ->putJson(route('offers.update', $offer), $this->payload($listing, $contact, [
                'status' => OfferStatus::Accepted->value,
                'amount' => 825000,
            ]))
            ->assertOk()
            ->assertJsonPath('offer.status', OfferStatus::Accepted->value);

        $this->actingAs($agent)->deleteJson(route('offers.destroy', $offer))->assertUnprocessable();
        $this->actingAs($agent)->putJson(route('offers.update', $offer), $this->payload($listing, $contact, ['status' => OfferStatus::Withdrawn->value]))->assertOk();
        $this->actingAs($agent)->deleteJson(route('offers.destroy', $offer))->assertNoContent();

        $this->assertSoftDeleted('offers', ['id' => $offer->id]);
    }

    public function test_agent_cannot_create_offer_for_unassigned_listing(): void
    {
        $agent = $this->userWithPermissions(['offer.create', 'contact.read']);
        $listing = Listing::factory()->create();
        $contact = Contact::factory()->create();

        $this->actingAs($agent)
            ->postJson(route('offers.store'), $this->payload($listing, $contact))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('listing_id');
    }

    public function test_offer_pages_render_expected_inertia_components(): void
    {
        $admin = $this->adminUser();
        $listing = Listing::factory()->create();
        $contact = Contact::factory()->create();
        $offer = Offer::factory()->create([
            'listing_id' => $listing->id,
            'contact_id' => $contact->id,
        ]);

        $this->actingAs($admin)
            ->get(route('offers.index'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('offers/index')
                ->has('offers.data')
                ->has('filters')
                ->has('listings', 1)
            );

        $this->actingAs($admin)
            ->get(route('offers.create'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('offers/create')
                ->has('listings', 1)
                ->has('contacts')
            );

        $this->actingAs($admin)
            ->get(route('offers.edit', $offer))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('offers/edit')
                ->where('offer.id', $offer->id)
                ->has('listings', 1)
                ->has('contacts')
            );

        $this->actingAs($admin)
            ->get(route('offers.show', $offer))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('offers/show')
                ->where('offer.id', $offer->id)
            );
    }

    private function payload(Listing $listing, Contact $contact, array $overrides = []): array
    {
        return array_merge([
            'listing_id' => $listing->id,
            'contact_id' => $contact->id,
            'status' => OfferStatus::Submitted->value,
            'amount' => 800000,
            'notes' => 'Initial offer.',
        ], $overrides);
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

    private function adminUser(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Role::factory()->create(['key' => 'admin']));

        return $user;
    }
}
