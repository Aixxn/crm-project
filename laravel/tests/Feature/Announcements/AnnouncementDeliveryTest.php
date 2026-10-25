<?php

namespace Tests\Feature\Announcements;

use App\Actions\Announcements\AcceptListingAnnouncement;
use App\Actions\Announcements\DeliverListingAnnouncementChunk;
use App\Enums\ContactRole;
use App\Jobs\DeliverListingAnnouncement;
use App\Models\Contact;
use App\Models\Listing;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Testing\TestResponse;
use RuntimeException;
use Tests\TestCase;

class AnnouncementDeliveryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.listing_webhook.secret' => 'test-secret']);
        Queue::fake();
    }

    public function test_signed_versioned_event_is_durably_accepted_without_synchronous_notifications(): void
    {
        $listing = Listing::factory()->active()->create();
        $this->buyer();
        $response = $this->signed(['event_id' => 'event-1', 'listing_id' => $listing->id]);
        $response->assertAccepted()->assertJsonStructure(['receipt_id']);
        $this->assertDatabaseCount('listing_announcements', 1);
        $this->assertDatabaseCount('notifications', 0);
        Queue::assertPushed(DeliverListingAnnouncement::class, 1);
    }

    public function test_raw_body_signature_freshness_and_required_identity_are_checked(): void
    {
        $listing = Listing::factory()->active()->create();
        $payload = ['event_id' => 'event-1', 'listing_id' => $listing->id];
        $this->signed($payload, now()->subMinutes(6)->timestamp)->assertUnauthorized();
        $this->signed($payload, signature: 'invalid')->assertUnauthorized();
        $this->signed(['listing_id' => $listing->id])->assertUnprocessable()->assertJsonValidationErrors('event_id');
        $this->signed(['event_id' => 'event-1'])->assertUnprocessable()->assertJsonValidationErrors('listing_id');
        $this->signed($payload, body: json_encode($payload, JSON_PRETTY_PRINT), signature: hash_hmac('sha256', now()->timestamp.'.'.json_encode($payload), 'test-secret'))->assertUnauthorized();
        $this->assertDatabaseCount('listing_announcements', 0);
    }

    public function test_equivalent_key_order_replays_same_receipt_after_listing_is_unpublished_and_conflicts_are_rejected(): void
    {
        $listing = Listing::factory()->active()->create();
        $payload = ['event_id' => 'event-1', 'listing_id' => $listing->id];
        $id = $this->signed($payload)->assertAccepted()->json('receipt_id');
        $listing->forceFill(['status' => 'Draft'])->save();
        $this->signed(array_reverse($payload, true))->assertAccepted()->assertJsonPath('receipt_id', $id);
        $other = Listing::factory()->active()->create();
        $this->signed(['event_id' => 'event-1', 'listing_id' => $other->id])->assertConflict();
        $this->signed(['event_id' => 'new-event', 'listing_id' => $listing->id])->assertUnprocessable();
        $this->assertDatabaseCount('listing_announcements', 1);
    }

    public function test_custom_staff_unverified_and_nonbuyer_users_are_omitted(): void
    {
        $listing = Listing::factory()->active()->create();
        $buyer = $this->buyer();
        $staff = $this->buyer();
        $role = Role::factory()->create(['key' => 'restricted']);
        $role->addPermission(Permission::factory()->create(['key' => 'task.read']));
        $staff->assignRole($role);
        $unverified = $this->buyer();
        $unverified->forceFill(['email_verified_at' => null])->save();
        $owner = User::factory()->create(['contact_id' => Contact::factory()->create(['role' => ContactRole::Owner])->id]);
        $id = app(AcceptListingAnnouncement::class)->handle('event-1', $listing->id);
        app(DeliverListingAnnouncementChunk::class)->handle($id);
        $this->assertCount(1, $buyer->notifications);
        foreach ([$staff, $unverified, $owner] as $omitted) {
            $this->assertCount(0, $omitted->notifications);
            $this->assertDatabaseHas('listing_announcement_deliveries', ['announcement_id' => $id, 'user_id' => $omitted->id, 'outcome' => 'ineligible']);
        }
        $this->assertDatabaseCount('notifications', 1);
    }

    public function test_duplicate_jobs_preserve_read_state_and_deleted_notifications_are_not_recreated(): void
    {
        $listing = Listing::factory()->active()->create();
        $first = $this->buyer();
        $second = $this->buyer();
        $id = app(AcceptListingAnnouncement::class)->handle('event-1', $listing->id);
        $delivery = app(DeliverListingAnnouncementChunk::class);
        $delivery->handle($id);
        $first->notifications->first()->markAsRead();
        $readAt = $first->notifications()->first()->read_at->toISOString();
        $second->notifications()->delete();
        $delivery->handle($id);
        $this->assertSame($readAt, $first->notifications()->first()->read_at->toISOString());
        $this->assertCount(0, $second->notifications()->get());
        $this->assertDatabaseCount('notifications', 1);
        $this->assertDatabaseHas('listing_announcement_deliveries', ['announcement_id' => $id, 'user_id' => $second->id, 'outcome' => 'delivered']);
    }

    public function test_delivery_rechecks_publication_and_buyer_eligibility(): void
    {
        $listing = Listing::factory()->active()->create();
        $buyer = $this->buyer();
        $id = app(AcceptListingAnnouncement::class)->handle('event-1', $listing->id);
        $buyer->contact->forceFill(['role' => ContactRole::Owner])->save();
        app(DeliverListingAnnouncementChunk::class)->handle($id);
        $this->assertDatabaseHas('listing_announcement_deliveries', ['announcement_id' => $id, 'user_id' => $buyer->id, 'outcome' => 'ineligible']);
        $next = app(AcceptListingAnnouncement::class)->handle('event-2', $listing->id);
        $listing->forceFill(['status' => 'Draft'])->save();
        app(DeliverListingAnnouncementChunk::class)->handle($next);
        $this->assertDatabaseHas('listing_announcement_deliveries', ['announcement_id' => $next, 'user_id' => $buyer->id, 'outcome' => 'unpublished']);
        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_failed_recipient_rolls_back_chunk_and_retry_recovers_once(): void
    {
        $listing = Listing::factory()->active()->create();
        $this->buyer();
        $this->buyer();
        $id = app(AcceptListingAnnouncement::class)->handle('event-1', $listing->id);
        $fail = true;
        DB::listen(function ($query) use (&$fail): void {
            if ($fail && str_starts_with($query->sql, 'insert into "notifications"')) {
                $fail = false;
                throw new RuntimeException('Simulated recipient failure');
            }
        });
        try {
            app(DeliverListingAnnouncementChunk::class)->handle($id);
            $this->fail('Expected recipient failure.');
        } catch (RuntimeException $error) {
            $this->assertSame('Simulated recipient failure', $error->getMessage());
        }
        $this->assertDatabaseCount('notifications', 0);
        $this->assertDatabaseCount('listing_announcement_deliveries', 0);
        $this->assertDatabaseHas('listing_announcements', ['id' => $id, 'recipient_cursor' => 0, 'completed_at' => null]);
        app(DeliverListingAnnouncementChunk::class)->handle($id);
        app(DeliverListingAnnouncementChunk::class)->handle($id);
        $this->assertDatabaseCount('notifications', 2);
    }

    public function test_bounded_fanout_recovers_interruption_and_excludes_users_created_after_acceptance(): void
    {
        $listing = Listing::factory()->active()->create();
        for ($index = 0; $index < 52; $index++) {
            $this->buyer();
        }
        $id = app(AcceptListingAnnouncement::class)->handle('event-1', $listing->id);
        $late = $this->buyer();
        $delivery = app(DeliverListingAnnouncementChunk::class);
        $delivery->handle($id);
        $this->assertDatabaseCount('listing_announcement_deliveries', 50);
        $this->assertDatabaseHas('listing_announcements', ['id' => $id, 'completed_at' => null]);
        $this->artisan('announcements:recover')->assertSuccessful();
        $delivery->handle($id);
        $this->assertDatabaseCount('notifications', 52);
        $this->assertCount(0, $late->notifications);
        $this->assertNotNull(DB::table('listing_announcements')->where('id', $id)->value('completed_at'));
        $delivery->handle($id);
        $this->assertDatabaseCount('notifications', 52);
    }

    public function test_receipt_failure_rolls_back_acceptance_and_schedules_nothing(): void
    {
        $listing = Listing::factory()->active()->create();
        $fail = true;
        DB::listen(function ($query) use (&$fail): void {
            if ($fail && str_starts_with($query->sql, 'insert into "listing_announcements"')) {
                $fail = false;
                throw new RuntimeException('Simulated receipt failure');
            }
        });
        try {
            app(AcceptListingAnnouncement::class)->handle('event-1', $listing->id);
            $this->fail('Expected receipt failure.');
        } catch (RuntimeException $error) {
            $this->assertSame('Simulated receipt failure', $error->getMessage());
        }
        $this->assertDatabaseCount('listing_announcements', 0);
        Queue::assertNothingPushed();
    }

    public function test_both_webhook_versions_have_a_shared_rate_limit_and_exact_csrf_exceptions(): void
    {
        $routes = app('router')->getRoutes();
        foreach (['webhooks.listings.offered', 'webhooks.v2.listings.offered'] as $name) {
            $this->assertContains('throttle:listing-webhooks', $routes->getByName($name)->gatherMiddleware());
        }
        for ($index = 0; $index < 60; $index++) {
            $this->postJson('/webhooks/v2/listings/offered')->assertUnauthorized();
        }
        $this->postJson('/webhooks/listings/offered')->assertTooManyRequests();
        $exceptions = app(PreventRequestForgery::class)->getExcludedPaths();
        $this->assertContains('webhooks/listings/offered', $exceptions);
        $this->assertContains('webhooks/v2/listings/offered', $exceptions);
        $this->assertNotContains('webhooks/*', $exceptions);
    }

    private function buyer(): User
    {
        return User::factory()->create(['contact_id' => Contact::factory()->create(['role' => ContactRole::Buyer])->id]);
    }

    private function signed(array $payload, ?int $timestamp = null, ?string $signature = null, ?string $body = null): TestResponse
    {
        $body ??= json_encode($payload, JSON_THROW_ON_ERROR);
        $timestamp ??= now()->timestamp;
        $signature ??= hash_hmac('sha256', $timestamp.'.'.$body, 'test-secret');

        return $this->call('POST', '/webhooks/v2/listings/offered', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json', 'HTTP_X_WEBHOOK_TIMESTAMP' => (string) $timestamp, 'HTTP_X_WEBHOOK_SIGNATURE' => $signature], $body);
    }
}
