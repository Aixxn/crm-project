<?php

namespace Tests\Feature\Workflows;

use App\Enums\InquiryStatus;
use App\Models\Contact;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class InquiryCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_agent_can_create_inquiry_for_assigned_listing(): void
    {
        $agent = $this->userWithPermissions(['inquiry.create']);
        $listing = Listing::factory()->create(['assigned_agent_id' => $agent->id]);
        $contact = Contact::factory()->create();

        $response = $this->actingAs($agent)->postJson(route('inquiries.store'), $this->payload($listing, $contact));

        $response->assertCreated()
            ->assertJsonPath('inquiry.listing_id', $listing->id);
    }

    public function test_agent_index_is_scoped_to_assigned_listing_inquiries(): void
    {
        $agent = $this->userWithPermissions(['inquiry.read']);
        $visible = Inquiry::factory()->create([
            'listing_id' => Listing::factory()->create(['assigned_agent_id' => $agent->id])->id,
        ]);
        $hidden = Inquiry::factory()->create();

        $response = $this->actingAs($agent)->getJson(route('inquiries.index'));

        $response->assertOk()
            ->assertJsonFragment(['id' => $visible->id])
            ->assertJsonMissing(['id' => $hidden->id]);
    }

    public function test_agent_can_update_and_delete_assigned_listing_inquiry(): void
    {
        $agent = $this->userWithPermissions(['inquiry.read', 'inquiry.update', 'inquiry.delete']);
        $listing = Listing::factory()->create(['assigned_agent_id' => $agent->id]);
        $contact = Contact::factory()->create();
        $inquiry = Inquiry::factory()->create(['listing_id' => $listing->id, 'contact_id' => $contact->id]);

        $this->actingAs($agent)->getJson(route('inquiries.show', $inquiry))->assertOk();

        $this->actingAs($agent)
            ->putJson(route('inquiries.update', $inquiry), $this->payload($listing, $contact, [
                'status' => InquiryStatus::Qualified->value,
            ]))
            ->assertOk()
            ->assertJsonPath('inquiry.status', InquiryStatus::Qualified->value);

        $this->actingAs($agent)->deleteJson(route('inquiries.destroy', $inquiry))->assertNoContent();

        $this->assertSoftDeleted('inquiries', ['id' => $inquiry->id]);
    }

    public function test_agent_cannot_create_inquiry_for_unassigned_listing(): void
    {
        $agent = $this->userWithPermissions(['inquiry.create']);
        $listing = Listing::factory()->create();
        $contact = Contact::factory()->create();

        $this->actingAs($agent)
            ->postJson(route('inquiries.store'), $this->payload($listing, $contact))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('listing_id');
    }

    public function test_inquiry_pages_render_expected_inertia_components(): void
    {
        $admin = $this->adminUser();
        $listing = Listing::factory()->create();
        $contact = Contact::factory()->create();
        $inquiry = Inquiry::factory()->create([
            'listing_id' => $listing->id,
            'contact_id' => $contact->id,
        ]);

        $this->actingAs($admin)
            ->get(route('inquiries.index'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('inquiries/index')
                ->has('inquiries.data')
                ->has('filters')
                ->has('listings', 1)
            );

        $this->actingAs($admin)
            ->get(route('inquiries.create'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('inquiries/create')
                ->has('listings', 1)
                ->has('contacts')
            );

        $this->actingAs($admin)
            ->get(route('inquiries.edit', $inquiry))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('inquiries/edit')
                ->where('inquiry.id', $inquiry->id)
                ->has('listings', 1)
                ->has('contacts')
            );

        $this->actingAs($admin)
            ->get(route('inquiries.show', $inquiry))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('inquiries/show')
                ->where('inquiry.id', $inquiry->id)
            );
    }

    private function payload(Listing $listing, Contact $contact, array $overrides = []): array
    {
        return array_merge([
            'listing_id' => $listing->id,
            'contact_id' => $contact->id,
            'status' => InquiryStatus::New->value,
            'source' => 'Manual',
            'intent' => 'buy',
            'budget' => 900000,
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
