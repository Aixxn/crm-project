<?php

namespace Tests\Feature\Listings;

use App\Enums\ContactRole;
use App\Enums\ListingStatus;
use App\Models\Contact;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\Note;
use App\Models\Offer;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Task;
use App\Models\User;
use App\Models\Viewing;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;
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

    public function test_admin_can_create_listing_with_up_to_three_images(): void
    {
        Storage::fake('public');

        $admin = $this->userWithRoleAndPermissions('admin');
        $agent = User::factory()->create();
        $owner = Contact::factory()->create(['role' => ContactRole::Owner]);

        $this->actingAs($admin)
            ->post(route('listings.store'), $this->payload([
                'assigned_agent_id' => $agent->id,
                'owner_contact_id' => $owner->id,
                'images' => [
                    UploadedFile::fake()->image('front.jpg'),
                    UploadedFile::fake()->image('kitchen.png'),
                    UploadedFile::fake()->image('suite.jpeg'),
                ],
            ]))
            ->assertRedirect();

        $listing = Listing::query()->where('address', '123 Main Street')->firstOrFail();

        $this->assertDatabaseCount('listing_media', 3);
        $this->assertDatabaseHas('listing_media', [
            'listing_id' => $listing->id,
            'type' => 'photo',
            'sort_order' => 0,
        ]);

        $listing->media->each(function ($media): void {
            $path = str($media->url)->after('/storage/')->toString();
            Storage::disk('public')->assertExists($path);
        });
    }

    public function test_listing_images_must_be_png_or_jpg_and_max_three(): void
    {
        Storage::fake('public');

        $admin = $this->userWithRoleAndPermissions('admin');

        $this->actingAs($admin)
            ->post(route('listings.store'), $this->payload([
                'images' => [
                    UploadedFile::fake()->image('one.jpg'),
                    UploadedFile::fake()->image('two.png'),
                    UploadedFile::fake()->image('three.jpg'),
                    UploadedFile::fake()->image('four.jpg'),
                ],
            ]))
            ->assertSessionHasErrors('images');

        $this->actingAs($admin)
            ->post(route('listings.store'), $this->payload([
                'images' => [
                    UploadedFile::fake()->create('contract.pdf', 12, 'application/pdf'),
                ],
            ]))
            ->assertSessionHasErrors('images.0');
    }

    public function test_create_page_includes_agent_and_owner_options(): void
    {
        $admin = $this->userWithRoleAndPermissions('admin');
        $agent = User::factory()->create(['name' => 'Agent A']);
        $owner = Contact::factory()->create(['role' => ContactRole::Owner]);

        $this->actingAs($admin)
            ->get(route('listings.create'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('listings/create')
                ->where('agents.0.id', $agent->id)
                ->where('owners.0.id', $owner->id)
            );
    }

    public function test_agent_create_page_scopes_agent_options_to_self(): void
    {
        $agent = $this->userWithRoleAndPermissions('agent', ['listing.create']);
        User::factory()->create(['name' => 'Other Agent']);

        $this->actingAs($agent)
            ->get(route('listings.create'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('listings/create')
                ->has('agents', 1)
                ->where('agents.0.id', $agent->id)
            );
    }

    public function test_show_payload_includes_listing_workspace_relationships(): void
    {
        $admin = $this->userWithRoleAndPermissions('admin');
        $listing = Listing::factory()->create();

        Inquiry::factory()->create(['listing_id' => $listing->id]);
        Viewing::factory()->create(['listing_id' => $listing->id]);
        Offer::factory()->create(['listing_id' => $listing->id]);
        Task::factory()->create([
            'related_entity_type' => $listing->getMorphClass(),
            'related_entity_id' => $listing->id,
        ]);
        Note::factory()->create([
            'related_entity_type' => $listing->getMorphClass(),
            'related_entity_id' => $listing->id,
        ]);

        $this->actingAs($admin)
            ->get(route('listings.show', $listing))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('listings/show')
                ->where('listing.id', $listing->id)
                ->has('listing.inquiries', 1)
                ->has('listing.viewings', 1)
                ->has('listing.offers', 1)
                ->has('listing.tasks', 1)
                ->has('listing.notes', 1)
            );
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
