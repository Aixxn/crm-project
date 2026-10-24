<?php

namespace Tests\Feature\Workflows;

use App\Actions\Lifecycle\ChangeRecord;
use App\Actions\Lifecycle\RecordTransition;
use App\Actions\Viewings\RequestPublicViewing;
use App\Models\Contact;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\Role;
use App\Models\User;
use App\Models\Viewing;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicViewingIntakeTest extends TestCase
{
    use RefreshDatabase;

    private function buyer(): User
    {
        return User::factory()->create(['contact_id' => Contact::factory()->create()->id]);
    }

    public function test_equivalent_offsets_are_one_active_request_and_rent_intent_is_preserved(): void
    {
        $buyer = $this->buyer();
        $listing = Listing::factory()->active()->create();
        $time = now()->addDays(3)->startOfSecond();
        $this->actingAs($buyer)->post(route('public.viewing-requests.store', $listing), ['scheduled_at' => $time->toISOString(), 'intent' => 'rent'])->assertSessionHasNoErrors();
        $this->post(route('public.viewing-requests.store', $listing), ['scheduled_at' => $time->copy()->timezone('Asia/Manila')->toIso8601String(), 'intent' => 'rent'])->assertSessionHasErrors('scheduled_at');
        $this->assertDatabaseCount('viewings', 1);
        $this->assertDatabaseCount('inquiries', 1);
        $this->assertDatabaseHas('inquiries', ['listing_id' => $listing->id, 'contact_id' => $buyer->contact_id, 'intent' => 'rent']);
        $this->assertTrue(Viewing::firstOrFail()->scheduled_at->equalTo($time));
    }

    public function test_cancellation_allows_deliberate_request_for_same_canonical_time(): void
    {
        $buyer = $this->buyer();
        $staff = User::factory()->create();
        $staff->assignRole(Role::factory()->create(['key' => 'admin']));
        $listing = Listing::factory()->active()->create(['assigned_agent_id' => $staff->id]);
        $time = now()->addDay()->toISOString();
        $intake = app(RequestPublicViewing::class);
        $first = $intake->handle($buyer, $listing, $time, 'rent');
        app(ChangeRecord::class)->update($staff, $first, ['status' => 'Cancelled']);
        $second = $intake->handle($buyer, $listing, $time, 'rent');
        $this->assertNotSame($first->id, $second->id);
        $this->assertDatabaseCount('viewings', 2);
        $this->assertDatabaseCount('inquiries', 1);
    }

    public function test_reused_rental_inquiry_keeps_intent_when_legacy_caller_omits_it(): void
    {
        $buyer = $this->buyer();
        $listing = Listing::factory()->active()->create();
        $inquiry = Inquiry::factory()->create(['listing_id' => $listing->id, 'contact_id' => $buyer->contact_id, 'intent' => 'rent', 'status' => 'Contacted', 'message' => 'Rental question']);
        app(RequestPublicViewing::class)->handle($buyer, $listing, now()->addDay()->toISOString());
        $this->assertDatabaseCount('inquiries', 1);
        $this->assertSame('rent', $inquiry->refresh()->intent);
        $this->assertStringStartsWith('Rental question', $inquiry->message);
    }

    public function test_failure_after_viewing_save_rolls_back_inquiry_append_and_viewing(): void
    {
        $buyer = $this->buyer();
        $listing = Listing::factory()->active()->create();
        $inquiry = Inquiry::factory()->create(['listing_id' => $listing->id, 'contact_id' => $buyer->contact_id, 'status' => 'New', 'message' => 'Original']);
        $this->mock(RecordTransition::class)->shouldReceive('handle')->once()->andThrow(new \RuntimeException('Audit storage unavailable'));
        try {
            app(RequestPublicViewing::class)->handle($buyer, $listing, now()->addDay()->toISOString());
            $this->fail('Expected rollback.');
        } catch (\RuntimeException) {
            $this->assertDatabaseCount('viewings', 0);
            $this->assertSame('Original', $inquiry->refresh()->message);
            $this->assertDatabaseCount('state_transitions', 0);
        }
    }

    public function test_stale_published_model_is_rechecked_before_writes(): void
    {
        $buyer = $this->buyer();
        $listing = Listing::factory()->active()->create();
        Listing::whereKey($listing->id)->update(['status' => 'Closed Lost']);
        $this->actingAs($buyer)->post(route('public.viewing-requests.store', $listing), ['scheduled_at' => now()->addDay()->toISOString(), 'intent' => 'rent'])->assertNotFound();
        $this->assertDatabaseCount('viewings', 0);
        $this->assertDatabaseCount('inquiries', 0);
    }

    public function test_offsetless_time_is_rejected_and_client_contact_is_not_identity(): void
    {
        $buyer = $this->buyer();
        $listing = Listing::factory()->active()->create();
        $other = Contact::factory()->create();
        $this->actingAs($buyer)->post(route('public.viewing-requests.store', $listing), ['scheduled_at' => now()->addDay()->toDateTimeString()])->assertSessionHasErrors('scheduled_at');
        $this->post(route('public.viewing-requests.store', $listing), ['scheduled_at' => now()->addDay()->toISOString(), 'contact_id' => $other->id])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('viewings', ['contact_id' => $buyer->contact_id]);
        $this->assertDatabaseMissing('viewings', ['contact_id' => $other->id]);
    }

    public function test_database_rejects_duplicate_active_time_and_terminal_time_is_reusable(): void
    {
        $viewing = Viewing::factory()->create(['status' => 'Cancelled']);
        $attributes = $viewing->only(['listing_id', 'contact_id', 'agent_id', 'scheduled_at']) + ['status' => 'Requested'];
        Viewing::create($attributes);
        $this->expectException(UniqueConstraintViolationException::class);
        Viewing::create($attributes);
    }
}
