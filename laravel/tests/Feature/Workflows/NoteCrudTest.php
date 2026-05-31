<?php

namespace Tests\Feature\Workflows;

use App\Models\Listing;
use App\Models\Note;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class NoteCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_agent_can_create_note_for_assigned_listing_as_current_user(): void
    {
        $agent = $this->userWithPermissions(['note.create']);
        $otherUser = User::factory()->create();
        $listing = Listing::factory()->create(['assigned_agent_id' => $agent->id]);

        $response = $this->actingAs($agent)->postJson(route('notes.store'), [
            ...$this->payload($listing),
            'author_id' => $otherUser->id,
        ]);

        $response->assertCreated()
            ->assertJsonPath('note.author_id', $agent->id)
            ->assertJsonPath('note.related_entity_id', $listing->id);
    }

    public function test_agent_index_is_scoped_to_assigned_related_records(): void
    {
        $agent = $this->userWithPermissions(['note.read']);
        $visibleListing = Listing::factory()->create(['assigned_agent_id' => $agent->id]);
        $visible = Note::factory()->create([
            'author_id' => $agent->id,
            'related_entity_type' => Listing::class,
            'related_entity_id' => $visibleListing->id,
        ]);
        $hidden = Note::factory()->create();

        $response = $this->actingAs($agent)->getJson(route('notes.index'));

        $response->assertOk()
            ->assertJsonFragment(['id' => $visible->id])
            ->assertJsonMissing(['id' => $hidden->id]);
    }

    public function test_agent_can_update_and_delete_assigned_listing_note(): void
    {
        $agent = $this->userWithPermissions(['note.read', 'note.update', 'note.delete']);
        $listing = Listing::factory()->create(['assigned_agent_id' => $agent->id]);
        $note = Note::factory()->create([
            'author_id' => $agent->id,
            'related_entity_type' => Listing::class,
            'related_entity_id' => $listing->id,
        ]);

        $this->actingAs($agent)->getJson(route('notes.show', $note))->assertOk();

        $this->actingAs($agent)
            ->putJson(route('notes.update', $note), $this->payload($listing, [
                'body' => 'Buyer called back and wants a weekend viewing.',
            ]))
            ->assertOk()
            ->assertJsonPath('note.body', 'Buyer called back and wants a weekend viewing.');

        $this->actingAs($agent)->deleteJson(route('notes.destroy', $note))->assertNoContent();

        $this->assertSoftDeleted('notes', ['id' => $note->id]);
    }

    public function test_agent_cannot_create_note_for_unassigned_listing(): void
    {
        $agent = $this->userWithPermissions(['note.create']);
        $listing = Listing::factory()->create();

        $this->actingAs($agent)
            ->postJson(route('notes.store'), $this->payload($listing))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('related_entity_id');
    }

    public function test_note_pages_render_expected_inertia_components(): void
    {
        $admin = $this->adminUser();
        $listing = Listing::factory()->create();
        $note = Note::factory()->create([
            'author_id' => $admin->id,
            'related_entity_type' => Listing::class,
            'related_entity_id' => $listing->id,
        ]);

        $this->actingAs($admin)
            ->get(route('notes.index'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('notes/index')
                ->has('notes.data')
                ->has('filters')
                ->has('relatedEntities')
            );

        $this->actingAs($admin)
            ->get(route('notes.create'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('notes/create')
                ->has('relatedEntities')
            );

        $this->actingAs($admin)
            ->get(route('notes.edit', $note))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('notes/edit')
                ->where('note.id', $note->id)
                ->has('relatedEntities')
            );

        $this->actingAs($admin)
            ->get(route('notes.show', $note))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('notes/show')
                ->where('note.id', $note->id)
            );
    }

    private function payload(Listing $listing, array $overrides = []): array
    {
        return array_merge([
            'body' => 'Seller prefers afternoon calls.',
            'related_entity_type' => Listing::class,
            'related_entity_id' => $listing->id,
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
