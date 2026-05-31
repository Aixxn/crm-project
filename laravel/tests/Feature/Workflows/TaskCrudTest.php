<?php

namespace Tests\Feature\Workflows;

use App\Enums\TaskStatus;
use App\Models\Listing;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class TaskCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_agent_can_create_task_for_assigned_listing_and_self(): void
    {
        $agent = $this->userWithPermissions(['task.create']);
        $listing = Listing::factory()->create(['assigned_agent_id' => $agent->id]);

        $response = $this->actingAs($agent)->postJson(route('tasks.store'), $this->payload($listing, $agent));

        $response->assertCreated()
            ->assertJsonPath('task.assignee_id', $agent->id)
            ->assertJsonPath('task.related_entity_id', $listing->id);
    }

    public function test_agent_index_is_scoped_to_assigned_related_records(): void
    {
        $agent = $this->userWithPermissions(['task.read']);
        $visibleListing = Listing::factory()->create(['assigned_agent_id' => $agent->id]);
        $visible = Task::factory()->create([
            'assignee_id' => $agent->id,
            'related_entity_type' => Listing::class,
            'related_entity_id' => $visibleListing->id,
        ]);
        $hidden = Task::factory()->create();

        $response = $this->actingAs($agent)->getJson(route('tasks.index'));

        $response->assertOk()
            ->assertJsonFragment(['id' => $visible->id])
            ->assertJsonMissing(['id' => $hidden->id]);
    }

    public function test_agent_can_update_and_delete_assigned_listing_task(): void
    {
        $agent = $this->userWithPermissions(['task.read', 'task.update', 'task.delete']);
        $listing = Listing::factory()->create(['assigned_agent_id' => $agent->id]);
        $task = Task::factory()->create([
            'assignee_id' => $agent->id,
            'related_entity_type' => Listing::class,
            'related_entity_id' => $listing->id,
        ]);

        $this->actingAs($agent)->getJson(route('tasks.show', $task))->assertOk();

        $this->actingAs($agent)
            ->putJson(route('tasks.update', $task), $this->payload($listing, $agent, [
                'status' => TaskStatus::Done->value,
                'title' => 'Collect signed seller disclosure',
            ]))
            ->assertOk()
            ->assertJsonPath('task.status', TaskStatus::Done->value);

        $this->actingAs($agent)->deleteJson(route('tasks.destroy', $task))->assertNoContent();

        $this->assertSoftDeleted('tasks', ['id' => $task->id]);
    }

    public function test_agent_cannot_create_task_for_unassigned_listing_or_another_assignee(): void
    {
        $agent = $this->userWithPermissions(['task.create']);
        $otherAgent = User::factory()->create();
        $unassignedListing = Listing::factory()->create();

        $this->actingAs($agent)
            ->postJson(route('tasks.store'), $this->payload($unassignedListing, $agent))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('related_entity_id');

        $assignedListing = Listing::factory()->create(['assigned_agent_id' => $agent->id]);

        $this->actingAs($agent)
            ->postJson(route('tasks.store'), $this->payload($assignedListing, $otherAgent))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('assignee_id');
    }

    public function test_task_pages_render_expected_inertia_components(): void
    {
        $admin = $this->adminUser();
        $assignee = User::factory()->create();
        $listing = Listing::factory()->create();
        $task = Task::factory()->create([
            'assignee_id' => $assignee->id,
            'related_entity_type' => Listing::class,
            'related_entity_id' => $listing->id,
        ]);

        $this->actingAs($admin)
            ->get(route('tasks.index'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('tasks/index')
                ->has('tasks.data')
                ->has('filters')
                ->has('assignees')
                ->has('relatedEntities')
            );

        $this->actingAs($admin)
            ->get(route('tasks.create'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('tasks/create')
                ->has('assignees')
                ->has('relatedEntities')
            );

        $this->actingAs($admin)
            ->get(route('tasks.edit', $task))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('tasks/edit')
                ->where('task.id', $task->id)
                ->has('assignees')
                ->has('relatedEntities')
            );

        $this->actingAs($admin)
            ->get(route('tasks.show', $task))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('tasks/show')
                ->where('task.id', $task->id)
            );
    }

    private function payload(Listing $listing, User $assignee, array $overrides = []): array
    {
        return array_merge([
            'assignee_id' => $assignee->id,
            'title' => 'Follow up with seller',
            'due_date' => now()->addDays(3)->toDateString(),
            'status' => TaskStatus::Open->value,
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
