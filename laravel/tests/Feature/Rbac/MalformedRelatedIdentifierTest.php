<?php

namespace Tests\Feature\Rbac;

use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\Note;
use App\Models\Offer;
use App\Models\Role;
use App\Models\Task;
use App\Models\User;
use App\Models\Viewing;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class MalformedRelatedIdentifierTest extends TestCase
{
    use RefreshDatabase;

    #[DataProvider('identifiers')]
    public function test_array_identifiers_return_validation_errors(string $resource, string $field): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(Role::factory()->create(['key' => 'admin']));
        $listing = Listing::factory()->create(['assigned_agent_id' => $admin->id, 'status' => 'Active']);
        $common = ['listing_id' => $listing->id, 'contact_id' => $listing->owner_contact_id];
        [$class, $input] = match ($resource) {
            'inquiries' => [Inquiry::class, [...$common, 'status' => 'New', 'source' => 'Manual', 'intent' => 'buy']],
            'offers' => [Offer::class, [...$common, 'status' => 'Submitted', 'amount' => '100.00']],
            'viewings' => [Viewing::class, [...$common, 'status' => 'Scheduled', 'agent_id' => $admin->id, 'scheduled_at' => now()->addDay()->toISOString()]],
            'tasks' => [Task::class, ['assignee_id' => $admin->id, 'title' => 'Follow up', 'status' => 'Open', 'related_entity_type' => Listing::class, 'related_entity_id' => $listing->id]],
            'notes' => [Note::class, ['author_id' => $admin->id, 'body' => 'Follow up', 'related_entity_type' => Listing::class, 'related_entity_id' => $listing->id]],
        };
        $record = $class::factory()->create($input);
        $invalid = [...$input, $field => []];
        $this->actingAs($admin)->postJson(route($resource.'.store'), $invalid)
            ->assertUnprocessable()->assertJsonValidationErrors($field);
        $this->putJson(route($resource.'.update', $record), $invalid)
            ->assertUnprocessable()->assertJsonValidationErrors($field);
        $this->assertDatabaseCount($resource, 1);
    }

    public static function identifiers(): iterable
    {
        foreach ([
            'inquiries' => ['listing_id', 'contact_id'],
            'offers' => ['listing_id', 'contact_id'],
            'viewings' => ['listing_id', 'contact_id', 'agent_id'],
            'tasks' => ['assignee_id', 'related_entity_id', 'related_entity_type'],
            'notes' => ['related_entity_id', 'related_entity_type'],
        ] as $resource => $fields) {
            foreach ($fields as $field) {
                yield $resource.' '.$field => [$resource, $field];
            }
        }
    }
}
