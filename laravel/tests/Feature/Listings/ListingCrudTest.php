<?php

namespace Tests\Feature\Listings;

use App\Enums\ContactRole;
use App\Enums\ListingStatus;
use App\Models\Contact;
use App\Models\Listing;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ListingCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_listing_for_any_agent(): void
    {
        $admin = $this->userWithRoleAndPermissions('admin');
        $agent = User::factory()->create();
        $owner = Contact::factory()->create(['role' => ContactRole::Owner]);

        $response = $this->actingAs($admin)->postJson(route('listings.store'), $this->payload([
            'assigned_agent_id' => $agent->id,
            'owner_contact_id' => $owner->id,
        ]));

        $response->assertCreated()
            ->assertJsonPath('listing.assigned_agent_id', $agent->id);

        $this->assertDatabaseHas('listings', [
            'assigned_agent_id' => $agent->id,
            'owner_contact_id' => $owner->id,
            'address' => '123 Main Street',
        ]);
    }

    public function test_agent_can_create_listing_only_for_self(): void
    {
        $agent = $this->userWithRoleAndPermissions('agent', ['listing.create']);
        $otherAgent = User::factory()->create();

        $allowed = $this->actingAs($agent)->postJson(route('listings.store'), $this->payload([
            'assigned_agent_id' => $agent->id,
        ]));

        $allowed->assertCreated();

        $denied = $this->actingAs($agent)->postJson(route('listings.store'), $this->payload([
            'assigned_agent_id' => $otherAgent->id,
        ]));

        $denied->assertUnprocessable()
            ->assertJsonValidationErrors('assigned_agent_id');
    }

    public function test_agent_index_is_scoped_to_assigned_listings(): void
    {
        $agent = $this->userWithRoleAndPermissions('agent', ['listing.read']);
        $ownListing = Listing::factory()->create(['assigned_agent_id' => $agent->id]);
        $otherListing = Listing::factory()->create();

        $response = $this->actingAs($agent)->getJson(route('listings.index'));

        $response->assertOk()
            ->assertJsonFragment(['id' => $ownListing->id])
            ->assertJsonMissing(['id' => $otherListing->id]);
    }

    public function test_agent_can_view_update_and_delete_assigned_listing(): void
    {
        $agent = $this->userWithRoleAndPermissions('agent', [
            'listing.read',
            'listing.update',
            'listing.delete',
        ]);
        $listing = Listing::factory()->create(['assigned_agent_id' => $agent->id]);

        $this->actingAs($agent)->getJson(route('listings.show', $listing))->assertOk();

        $this->actingAs($agent)
            ->putJson(route('listings.update', $listing), $this->payload([
                'assigned_agent_id' => $agent->id,
                'address' => '456 Updated Avenue',
            ]))
            ->assertOk()
            ->assertJsonPath('listing.address', '456 Updated Avenue');

        $this->actingAs($agent)
            ->deleteJson(route('listings.destroy', $listing))
            ->assertNoContent();

        $this->assertSoftDeleted('listings', ['id' => $listing->id]);
    }

    public function test_agent_cannot_manage_unassigned_listing(): void
    {
        $agent = $this->userWithRoleAndPermissions('agent', [
            'listing.read',
            'listing.update',
            'listing.delete',
        ]);
        $listing = Listing::factory()->create();

        $this->actingAs($agent)->getJson(route('listings.show', $listing))->assertForbidden();
        $this->actingAs($agent)->putJson(route('listings.update', $listing), $this->payload())->assertForbidden();
        $this->actingAs($agent)->deleteJson(route('listings.destroy', $listing))->assertForbidden();
    }

    public function test_store_listing_validates_required_fields(): void
    {
        $admin = $this->userWithRoleAndPermissions('admin');

        $response = $this->actingAs($admin)->postJson(route('listings.store'), []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors([
                'assigned_agent_id',
                'owner_contact_id',
                'status',
                'address',
                'price',
            ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'assigned_agent_id' => User::factory()->create()->id,
            'owner_contact_id' => Contact::factory()->create(['role' => ContactRole::Owner])->id,
            'status' => ListingStatus::Active->value,
            'address' => '123 Main Street',
            'property_type' => 'Condo',
            'price' => 750000,
            'bedrooms' => 2,
            'bathrooms' => 2,
            'area_sqft' => 1200,
        ], $overrides);
    }

    /**
     * @param  array<int, string>  $permissionKeys
     */
    private function userWithRoleAndPermissions(string $roleKey, array $permissionKeys = []): User
    {
        $user = User::factory()->create();
        $role = Role::factory()->create(['key' => $roleKey]);

        foreach ($permissionKeys as $permissionKey) {
            $role->addPermission(Permission::factory()->create(['key' => $permissionKey]));
        }

        $user->assignRole($role);

        return $user;
    }
}
