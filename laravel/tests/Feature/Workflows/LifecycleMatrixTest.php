<?php

namespace Tests\Feature\Workflows;

use App\Actions\Lifecycle\ChangeRecord;
use App\Actions\Lifecycle\RecordTransition;
use App\Enums\ListingStatus;
use App\Enums\OfferStatus;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\Offer;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Task;
use App\Models\User;
use App\Models\Viewing;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class LifecycleMatrixTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $actor = User::factory()->create();
        $actor->assignRole(Role::factory()->create(['key' => 'admin']));

        return $actor;
    }

    public static function transitions(): array
    {
        $tables = [
            Inquiry::class => ['New' => ['Contacted', 'Closed'], 'Contacted' => ['Qualified', 'Closed'], 'Qualified' => ['Converted', 'Closed'], 'Converted' => [], 'Closed' => []],
            Viewing::class => ['Requested' => ['Scheduled', 'Cancelled'], 'Scheduled' => ['Completed', 'No Show', 'Cancelled'], 'Completed' => [], 'No Show' => [], 'Cancelled' => []],
            Offer::class => ['Submitted' => ['Accepted', 'Rejected', 'Withdrawn'], 'Accepted' => ['Withdrawn'], 'Rejected' => [], 'Withdrawn' => []],
            Task::class => ['Open' => ['In Progress', 'Done'], 'In Progress' => ['Open', 'Done'], 'Done' => ['Open']],
            Listing::class => ['Draft' => ['Active', 'Closed Lost'], 'Active' => ['Under Offer', 'Closed Lost'], 'Under Offer' => ['Active', 'Closed', 'Closed Lost'], 'Closed' => [], 'Closed Lost' => []],
        ];
        $cases = [];
        foreach ($tables as $class => $states) {
            foreach ($states as $old => $allowed) {
                foreach (array_keys($states) as $new) {
                    if ($old !== $new) {
                        $cases[$class.' '.$old.' to '.$new] = [$class, $old, $new, in_array($new, $allowed, true)];
                    }
                }
            }
        }

        return $cases;
    }

    #[DataProvider('transitions')]
    public function test_transition_contract(string $class, string $old, string $new, bool $allowed): void
    {
        $actor = $this->admin();
        $listing = Listing::factory()->active()->create(['assigned_agent_id' => $actor->id]);
        if ($class === Listing::class) {
            $record = $listing;
            $record->update(['status' => $old]);
            if ($new === 'Closed' && $old === 'Under Offer') {
                Offer::factory()->create(['listing_id' => $listing->id, 'status' => 'Accepted']);
            }
        } elseif ($class === Task::class) {
            $record = Task::factory()->create(['status' => $old, 'related_entity_type' => Listing::class, 'related_entity_id' => $listing->id, 'assignee_id' => $actor->id]);
        } else {
            $attributes = ['status' => $old, 'listing_id' => $listing->id, 'contact_id' => $listing->owner_contact_id];
            if ($class === Viewing::class) {
                $attributes += ['agent_id' => $actor->id, 'scheduled_at' => now()->addDay()];
            }
            $record = $class::factory()->create($attributes);
        }
        try {
            app(ChangeRecord::class)->update($actor, $record, ['status' => $new, 'operation' => $class === Task::class && $old === 'Done' ? 'reopen' : 'transition', 'reason' => 'Contract verification']);
            $this->assertTrue($allowed, 'Invalid transition succeeded.');
            $this->assertSame($new, $record->refresh()->status->value);
            $this->assertDatabaseHas('state_transitions', ['entity_id' => $record->id, 'old_state' => $old, 'new_state' => $new, 'actor_id' => $actor->id]);
        } catch (ValidationException) {
            $this->assertFalse($allowed, 'Valid transition failed.');
            $this->assertSame($old, $record->refresh()->status->value);
            $this->assertDatabaseMissing('state_transitions', ['entity_id' => $record->id]);
        }
    }

    public function test_failed_history_insert_rolls_back_offer_and_parent(): void
    {
        $actor = $this->admin();
        $listing = Listing::factory()->active()->create();
        $offer = Offer::factory()->create(['listing_id' => $listing->id, 'status' => 'Submitted']);
        $this->mock(RecordTransition::class)->shouldReceive('handle')->once()->andThrow(new \RuntimeException('History unavailable'));
        try {
            app(ChangeRecord::class)->update($actor, $offer, ['status' => 'Accepted']);
            $this->fail('Expected history failure.');
        } catch (\RuntimeException) {
            $this->assertSame(OfferStatus::Submitted, $offer->refresh()->status);
            $this->assertSame(ListingStatus::Active, $listing->refresh()->status);
            $this->assertDatabaseCount('state_transitions', 0);
        }
    }

    public function test_successful_closure_timestamp_survives_correction_and_retry(): void
    {
        $actor = $this->admin();
        $listing = Listing::factory()->create(['status' => 'Under Offer', 'assigned_agent_id' => $actor->id]);
        Offer::factory()->create(['listing_id' => $listing->id, 'status' => 'Accepted']);
        app(ChangeRecord::class)->update($actor, $listing, ['status' => 'Closed']);
        $closedAt = $listing->refresh()->closed_at->toISOString();
        $this->travel(4)->days();
        app(ChangeRecord::class)->update($actor, $listing, ['status' => 'Closed', 'address' => 'Corrected address', 'operation' => 'correct', 'reason' => 'Address typo']);
        $this->assertSame($closedAt, $listing->refresh()->closed_at->toISOString());
        $this->assertDatabaseHas('state_transitions', ['entity_id' => $listing->id, 'operation' => 'correct', 'reason' => 'Address typo']);
    }

    public function test_historical_viewing_time_correction_requires_admin_reason_and_preserves_outcome(): void
    {
        $this->freezeTime();
        $actor = $this->admin();
        $viewing = Viewing::factory()->create(['agent_id' => $actor->id, 'status' => 'Completed', 'listing_id' => Listing::factory()->create(['status' => 'Closed'])->id]);
        $attributes = $viewing->only(['listing_id', 'contact_id', 'agent_id']) + ['status' => 'Completed', 'scheduled_at' => now()->subDays(3)->toISOString(), 'operation' => 'correct'];
        $this->actingAs($actor)->putJson(route('viewings.update', $viewing), $attributes)->assertUnprocessable()->assertJsonValidationErrors('reason');
        $this->putJson(route('viewings.update', $viewing), $attributes + ['reason' => 'Correct appointment date'])->assertOk();
        $this->assertTrue($viewing->refresh()->scheduled_at->equalTo(now()->subDays(3)->startOfSecond()));
        $this->assertDatabaseHas('state_transitions', ['entity_id' => $viewing->id, 'old_state' => 'Completed', 'new_state' => 'Completed', 'reason' => 'Correct appointment date']);
        $this->putJson(route('viewings.update', $viewing), array_replace($attributes, ['status' => 'Scheduled', 'reason' => 'Rewind']))->assertUnprocessable();
    }

    public function test_accepted_withdrawal_releases_listing_but_deleted_acceptance_cannot_be_replaced(): void
    {
        $actor = $this->admin();
        $listing = Listing::factory()->create(['status' => 'Under Offer', 'assigned_agent_id' => $actor->id]);
        $offer = Offer::factory()->create(['listing_id' => $listing->id, 'status' => 'Accepted']);
        $this->actingAs($actor)->deleteJson(route('offers.destroy', $offer))->assertUnprocessable();
        app(ChangeRecord::class)->update($actor, $offer, ['status' => 'Withdrawn']);
        $this->assertSame(ListingStatus::Active, $listing->refresh()->status);
        $this->assertDatabaseHas('state_transitions', ['entity_id' => $listing->id, 'old_state' => 'Under Offer', 'new_state' => 'Active']);
    }

    public function test_database_rejects_two_accepted_offers_even_if_first_is_deleted(): void
    {
        $listing = Listing::factory()->active()->create();
        Offer::factory()->create(['listing_id' => $listing->id, 'status' => 'Accepted', 'deleted_at' => now()]);
        $this->expectException(UniqueConstraintViolationException::class);
        Offer::factory()->create(['listing_id' => $listing->id, 'status' => 'Accepted']);
    }

    public function test_activity_cannot_move_out_of_closed_listing(): void
    {
        $actor = $this->admin();
        $listing = Listing::factory()->create(['status' => 'Closed Lost']);
        $inquiry = Inquiry::factory()->create(['listing_id' => $listing->id]);
        $this->expectException(ValidationException::class);
        app(ChangeRecord::class)->update($actor, $inquiry, ['listing_id' => Listing::factory()->active()->create()->id]);
    }

    public function test_create_cannot_reuse_a_persisted_closed_record(): void
    {
        $actor = $this->admin();
        $listing = Listing::factory()->create(['status' => 'Closed']);
        try {
            app(ChangeRecord::class)->create($actor, $listing, ['status' => 'Draft']);
            $this->fail('Expected a new-model requirement.');
        } catch (ValidationException) {
            $this->assertSame(ListingStatus::Closed, $listing->refresh()->status);
            $this->assertDatabaseCount('state_transitions', 0);
        }
    }

    public function test_identical_terminal_retry_does_not_create_history_or_change_closure(): void
    {
        $actor = $this->admin();
        $listing = Listing::factory()->create(['status' => 'Closed', 'closed_at' => now()]);
        $closedAt = $listing->closed_at;
        app(ChangeRecord::class)->update($actor, $listing, ['status' => 'Closed', 'address' => $listing->address]);
        $this->assertTrue($closedAt->equalTo($listing->refresh()->closed_at));
        $this->assertDatabaseCount('state_transitions', 0);
    }

    public function test_equivalent_offset_terminal_viewing_retry_is_unchanged(): void
    {
        $actor = $this->admin();
        $viewing = Viewing::factory()->create(['status' => 'Completed']);
        $time = $viewing->scheduled_at->copy()->timezone('Asia/Manila')->toIso8601String();
        app(ChangeRecord::class)->update($actor, $viewing, ['status' => 'Completed', 'scheduled_at' => $time]);
        $this->assertDatabaseCount('state_transitions', 0);
        $this->assertSame('Completed', $viewing->refresh()->status->value);
    }

    public function test_task_reopening_requires_explicit_operation_and_reason(): void
    {
        $actor = $this->admin();
        $task = Task::factory()->create(['status' => 'Done', 'assignee_id' => $actor->id]);
        foreach ([['status' => 'Open'], ['status' => 'Open', 'operation' => 'reopen']] as $attributes) {
            try {
                app(ChangeRecord::class)->update($actor, $task, $attributes);
                $this->fail('Expected explicit reason.');
            } catch (ValidationException) {
                $this->assertSame('Done', $task->refresh()->status->value);
            }
        }
        app(ChangeRecord::class)->update($actor, $task, ['status' => 'Open', 'operation' => 'reopen', 'reason' => 'Further follow-up']);
        $this->assertDatabaseHas('state_transitions', ['entity_id' => $task->id, 'operation' => 'reopen', 'reason' => 'Further follow-up']);
    }

    public function test_stale_delete_rechecks_accepted_offer_under_parent_lock(): void
    {
        $actor = $this->admin();
        $listing = Listing::factory()->active()->create();
        $stale = Offer::factory()->create(['listing_id' => $listing->id, 'status' => 'Submitted']);
        app(ChangeRecord::class)->update($actor, $stale->fresh(), ['status' => 'Accepted']);
        try {
            app(ChangeRecord::class)->deleteOffer($actor, $stale);
            $this->fail('A stale Submitted model must not delete an Accepted offer.');
        } catch (ValidationException) {
            $this->assertDatabaseHas('offers', ['id' => $stale->id, 'status' => 'Accepted', 'deleted_at' => null]);
        }
    }

    public function test_closed_lost_requires_withdrawal_and_never_sets_closed_at(): void
    {
        $actor = $this->admin();
        $listing = Listing::factory()->create(['status' => 'Under Offer', 'assigned_agent_id' => $actor->id]);
        $offer = Offer::factory()->create(['listing_id' => $listing->id, 'status' => 'Accepted']);
        try {
            app(ChangeRecord::class)->update($actor, $listing, ['status' => 'Closed Lost']);
            $this->fail('Accepted offer must be resolved first.');
        } catch (ValidationException) {
            $this->assertSame('Under Offer', $listing->refresh()->status->value);
        }
        app(ChangeRecord::class)->update($actor, $offer, ['status' => 'Withdrawn']);
        app(ChangeRecord::class)->update($actor, $listing, ['status' => 'Closed Lost']);
        $this->assertNull($listing->refresh()->closed_at);
    }

    public function test_initial_state_and_closed_intake_guards_apply_to_direct_operations(): void
    {
        $actor = $this->admin();
        $listing = Listing::factory()->create(['status' => 'Closed Lost']);
        foreach ([new Inquiry, new Offer, new Viewing] as $record) {
            $attributes = ['listing_id' => $listing->id, 'contact_id' => $listing->owner_contact_id, 'status' => match ($record::class) {
                Inquiry::class => 'New', Offer::class => 'Submitted', Viewing::class => 'Requested'
            }, 'amount' => '12.50', 'source' => 'Test', 'intent' => 'rent', 'agent_id' => $actor->id, 'scheduled_at' => now()->addDay()->toISOString()];
            try {
                app(ChangeRecord::class)->create($actor, $record, $attributes);
                $this->fail('Closed Lost must reject intake.');
            } catch (ValidationException $error) {
                $this->assertArrayHasKey('listing_id', $error->errors());
            }
        }
        foreach ([[new Listing, 'Active'], [new Inquiry, 'Qualified'], [new Offer, 'Accepted'], [new Viewing, 'Completed'], [new Task, 'Done']] as [$record, $state]) {
            try {
                app(ChangeRecord::class)->create($actor, $record, ['status' => $state]);
                $this->fail('Initial state was bypassed.');
            } catch (ValidationException $error) {
                $this->assertArrayHasKey('status', $error->errors());
            }
        }
        $this->assertDatabaseCount('state_transitions', 0);
    }

    public function test_non_admin_cannot_correct_terminal_viewing_and_zero_offer_cannot_be_accepted(): void
    {
        $actor = User::factory()->create();
        $role = Role::factory()->create(['key' => 'restricted-agent']);
        foreach (['viewing.update', 'contact.read', 'offer.update'] as $permission) {
            $role->addPermission(Permission::factory()->create(['key' => $permission]));
        }
        $actor->assignRole($role);
        $listing = Listing::factory()->active()->create(['assigned_agent_id' => $actor->id]);
        $viewing = Viewing::factory()->create(['listing_id' => $listing->id, 'agent_id' => $actor->id, 'status' => 'Completed']);
        try {
            app(ChangeRecord::class)->update($actor, $viewing, ['scheduled_at' => now()->subDay()->toISOString(), 'operation' => 'correct', 'reason' => 'Historical correction']);
            $this->fail('Staff cannot make administrator corrections.');
        } catch (ValidationException $error) {
            $this->assertArrayHasKey('reason', $error->errors());
        }
        $offer = Offer::factory()->create(['listing_id' => $listing->id, 'contact_id' => $listing->owner_contact_id, 'amount' => '0.00', 'status' => 'Submitted']);
        try {
            app(ChangeRecord::class)->update($actor, $offer, ['status' => 'Accepted']);
            $this->fail('Zero amount cannot be accepted.');
        } catch (ValidationException $error) {
            $this->assertArrayHasKey('amount', $error->errors());
            $this->assertSame('Submitted', $offer->refresh()->status->value);
            $this->assertSame('Active', $listing->refresh()->status->value);
        }
        $this->assertDatabaseCount('state_transitions', 0);
    }

    public function test_pending_offer_deletion_requires_a_terminal_decision(): void
    {
        $actor = $this->admin();
        $listing = Listing::factory()->active()->create();
        $offer = Offer::factory()->create(['listing_id' => $listing->id, 'status' => 'Submitted']);
        $this->actingAs($actor)->deleteJson(route('offers.destroy', $offer))->assertUnprocessable();
        $this->assertDatabaseHas('offers', ['id' => $offer->id, 'status' => 'Submitted', 'deleted_at' => null]);
        app(ChangeRecord::class)->update($actor, $offer, ['status' => 'Rejected']);
        $this->deleteJson(route('offers.destroy', $offer))->assertNoContent();
        $this->assertSoftDeleted($offer);
    }
}
