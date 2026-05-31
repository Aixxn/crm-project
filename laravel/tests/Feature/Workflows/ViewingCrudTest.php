<?php

namespace Tests\Feature\Workflows;

use App\Enums\ViewingStatus;
use App\Models\Contact;
use App\Models\Listing;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Models\Viewing;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class ViewingCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_agent_can_create_viewing_for_assigned_listing_and_self(): void
    {
        $agent = $this->userWithPermissions(['viewing.create']);
        $listing = Listing::factory()->create(['assigned_agent_id' => $agent->id]);
        $contact = Contact::factory()->create();

        $response = $this->actingAs($agent)->postJson(route('viewings.store'), $this->payload($listing, $contact, $agent));

        $response->assertCreated()
            ->assertJsonPath('viewing.agent_id', $agent->id);
    }

    public function test_agent_can_update_and_delete_assigned_listing_viewing(): void
    {
        $agent = $this->userWithPermissions(['viewing.read', 'viewing.update', 'viewing.delete']);
        $listing = Listing::factory()->create(['assigned_agent_id' => $agent->id]);
        $contact = Contact::factory()->create();
        $viewing = Viewing::factory()->create([
            'listing_id' => $listing->id,
            'contact_id' => $contact->id,
            'agent_id' => $agent->id,
        ]);

        $this->actingAs($agent)->getJson(route('viewings.show', $viewing))->assertOk();

        $this->actingAs($agent)
            ->putJson(route('viewings.update', $viewing), $this->payload($listing, $contact, $agent, [
                'status' => ViewingStatus::Completed->value,
            ]))
            ->assertOk()
            ->assertJsonPath('viewing.status', ViewingStatus::Completed->value);

        $this->actingAs($agent)->deleteJson(route('viewings.destroy', $viewing))->assertNoContent();

        $this->assertSoftDeleted('viewings', ['id' => $viewing->id]);
    }

    public function test_agent_cannot_assign_viewing_to_another_agent(): void
    {
        $agent = $this->userWithPermissions(['viewing.create']);
        $otherAgent = User::factory()->create();
        $listing = Listing::factory()->create(['assigned_agent_id' => $agent->id]);
        $contact = Contact::factory()->create();

        $this->actingAs($agent)
            ->postJson(route('viewings.store'), $this->payload($listing, $contact, $otherAgent))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('agent_id');
    }

    public function test_viewing_pages_render_expected_inertia_components(): void
    {
        $admin = $this->adminUser();
        $agent = User::factory()->create();
        $listing = Listing::factory()->create();
        $contact = Contact::factory()->create();
        $viewing = Viewing::factory()->create([
            'listing_id' => $listing->id,
            'contact_id' => $contact->id,
            'agent_id' => $agent->id,
        ]);

        $this->actingAs($admin)
            ->get(route('viewings.index'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('viewings/index')
                ->has('viewings.data')
                ->has('filters')
                ->has('listings', 1)
            );

        $this->actingAs($admin)
            ->get(route('viewings.create'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('viewings/create')
                ->has('listings', 1)
                ->has('contacts')
                ->has('agents')
            );

        $this->actingAs($admin)
            ->get(route('viewings.edit', $viewing))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('viewings/edit')
                ->where('viewing.id', $viewing->id)
                ->has('listings', 1)
                ->has('contacts')
                ->has('agents')
            );

        $this->actingAs($admin)
            ->get(route('viewings.show', $viewing))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('viewings/show')
                ->where('viewing.id', $viewing->id)
            );
    }

    private function payload(Listing $listing, Contact $contact, User $agent, array $overrides = []): array
    {
        return array_merge([
            'listing_id' => $listing->id,
            'contact_id' => $contact->id,
            'agent_id' => $agent->id,
            'status' => ViewingStatus::Scheduled->value,
            'scheduled_at' => now()->addDay()->toDateTimeString(),
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
