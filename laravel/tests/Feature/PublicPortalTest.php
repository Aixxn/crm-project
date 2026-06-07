<?php

namespace Tests\Feature;

use App\Enums\ContactRole;
use App\Enums\InquiryStatus;
use App\Enums\ListingStatus;
use App\Enums\ViewingStatus;
use App\Models\Contact;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\ListingMedia;
use App\Models\Role;
use App\Models\SavedListing;
use App\Models\User;
use App\Models\Viewing;
use App\Notifications\ListingOfferedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class PublicPortalTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_landing_page_renders(): void
    {
        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('welcome')
            );
    }

    public function test_browse_shows_only_public_listing_statuses(): void
    {
        $activeListing = Listing::factory()->active()->create(['address' => '100 Market Street']);
        ListingMedia::factory()->create(['listing_id' => $activeListing->id, 'sort_order' => 0]);
        Listing::factory()->create(['status' => ListingStatus::UnderOffer]);
        Listing::factory()->create(['status' => ListingStatus::Draft]);
        Listing::factory()->create(['status' => ListingStatus::Closed]);

        $this->get(route('public.browse'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('public/browse')
                ->where('resultCount', 2)
                ->has('listings', 2)
                ->has('filterOptions.propertyTypes')
                ->has('savedListingIds')
            );
    }

    public function test_property_detail_exposes_buyer_safe_listing_data(): void
    {
        $listing = Listing::factory()->active()->create();

        $this->get(route('public.property.show', $listing))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('public/property')
                ->where('listing.id', $listing->id)
                ->where('listing.address', $listing->address)
                ->missing('listing.owner')
                ->missing('listing.notes')
                ->where('isSaved', false)
            );
    }

    public function test_featured_property_detail_renders_even_without_public_listings(): void
    {
        $this->get(route('public.property.featured'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('public/property')
                ->where('listing', null)
                ->where('isSaved', false)
            );
    }

    public function test_buyer_registration_creates_buyer_contact_and_redirects_to_login(): void
    {
        $this->post('/register', [
            'name' => 'Alex Morgan',
            'email' => 'alex@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect(route('login'));

        $user = User::query()->where('email', 'alex@example.com')->firstOrFail();

        $this->assertGuest();
        $this->assertNotNull($user->contact_id);
        $this->assertDatabaseHas('contacts', [
            'id' => $user->contact_id,
            'role' => ContactRole::Buyer->value,
            'first_name' => 'Alex',
            'last_name' => 'Morgan',
            'email' => 'alex@example.com',
        ]);
    }

    public function test_buyer_cannot_access_crm_dashboard(): void
    {
        $buyer = User::factory()->create();

        $this->actingAs($buyer)
            ->get(route('dashboard'))
            ->assertRedirect(route('public.my-home'));
    }

    public function test_authentication_is_required_for_buyer_portal_actions(): void
    {
        $listing = Listing::factory()->active()->create();

        $this->post(route('public.inquiries.store', $listing), [
            'intent' => 'buy',
            'message' => 'I want more information.',
        ])->assertRedirect(route('login'));

        $this->get(route('public.my-home'))->assertRedirect(route('login'));
        $this->get(route('public.deal-tracker'))->assertRedirect(route('login'));
        $this->get(route('public.settings'))->assertRedirect(route('login'));
    }

    public function test_buyer_can_save_and_unsave_public_listing(): void
    {
        $buyer = User::factory()->create();
        $listing = Listing::factory()->active()->create();

        $this->actingAs($buyer)
            ->post(route('public.saved-listings.store'), ['listing_id' => $listing->id])
            ->assertRedirect();

        $this->assertDatabaseHas('saved_listings', [
            'user_id' => $buyer->id,
            'listing_id' => $listing->id,
            'deleted_at' => null,
        ]);

        $this->actingAs($buyer)
            ->delete(route('public.saved-listings.destroy', $listing))
            ->assertRedirect();

        $this->assertSoftDeleted(SavedListing::class, [
            'user_id' => $buyer->id,
            'listing_id' => $listing->id,
        ]);
    }

    public function test_buyer_inquiry_creates_crm_inquiry_with_buyer_contact(): void
    {
        $buyer = User::factory()->create(['contact_id' => null]);
        $listing = Listing::factory()->active()->create();

        $this->actingAs($buyer)
            ->post(route('public.inquiries.store', $listing), [
                'intent' => 'buy',
                'budget' => 900000,
                'message' => 'Please send the disclosure package.',
            ])
            ->assertRedirect();

        $buyer->refresh();

        $this->assertNotNull($buyer->contact_id);
        $this->assertDatabaseHas('inquiries', [
            'listing_id' => $listing->id,
            'contact_id' => $buyer->contact_id,
            'status' => InquiryStatus::New->value,
            'source' => 'Public Portal',
            'intent' => 'buy',
            'message' => 'Please send the disclosure package.',
        ]);
    }

    public function test_buyer_viewing_request_creates_requested_viewing_for_assigned_agent(): void
    {
        $buyerContact = Contact::factory()->create(['role' => ContactRole::Buyer]);
        $buyer = User::factory()->create(['contact_id' => $buyerContact->id]);
        $agent = User::factory()->create();
        $listing = Listing::factory()->active()->create(['assigned_agent_id' => $agent->id]);
        $scheduledAt = now()->addDays(2)->setTime(14, 0);

        $this->actingAs($buyer)
            ->post(route('public.viewing-requests.store', $listing), [
                'scheduled_at' => $scheduledAt->toDateTimeString(),
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('viewings', [
            'listing_id' => $listing->id,
            'contact_id' => $buyerContact->id,
            'agent_id' => $agent->id,
            'status' => ViewingStatus::Requested->value,
        ]);
        $this->assertDatabaseHas('inquiries', [
            'listing_id' => $listing->id,
            'contact_id' => $buyerContact->id,
            'status' => InquiryStatus::New->value,
            'source' => 'Public Portal',
            'intent' => 'buy',
            'message' => 'Viewing requested for '.$scheduledAt->format('M j, Y g:i A').'.',
        ]);
    }

    public function test_viewing_request_reuses_existing_open_inquiry_for_buyer_listing(): void
    {
        $buyerContact = Contact::factory()->create(['role' => ContactRole::Buyer]);
        $buyer = User::factory()->create(['contact_id' => $buyerContact->id]);
        $listing = Listing::factory()->active()->create();
        $scheduledAt = now()->addDays(3)->setTime(10, 30);

        Inquiry::factory()->create([
            'listing_id' => $listing->id,
            'contact_id' => $buyerContact->id,
            'status' => InquiryStatus::Contacted,
            'source' => 'Public Portal',
            'intent' => 'buy',
            'message' => 'Initial buyer message.',
        ]);

        $this->actingAs($buyer)
            ->post(route('public.viewing-requests.store', $listing), [
                'scheduled_at' => $scheduledAt->toDateTimeString(),
            ])
            ->assertRedirect();

        $this->assertSame(1, Inquiry::query()
            ->where('listing_id', $listing->id)
            ->where('contact_id', $buyerContact->id)
            ->count());
        $this->assertDatabaseHas('inquiries', [
            'listing_id' => $listing->id,
            'contact_id' => $buyerContact->id,
            'status' => InquiryStatus::Contacted->value,
            'message' => 'Initial buyer message.'."\n\n".'Viewing requested for '.$scheduledAt->format('M j, Y g:i A').'.',
        ]);
        $this->assertDatabaseHas('viewings', [
            'listing_id' => $listing->id,
            'contact_id' => $buyerContact->id,
            'status' => ViewingStatus::Requested->value,
        ]);
    }

    public function test_duplicate_pending_viewing_request_for_same_time_is_blocked(): void
    {
        $buyerContact = Contact::factory()->create(['role' => ContactRole::Buyer]);
        $buyer = User::factory()->create(['contact_id' => $buyerContact->id]);
        $listing = Listing::factory()->active()->create();
        $scheduledAt = now()->addDays(4)->setTime(11, 0);

        Viewing::factory()->create([
            'listing_id' => $listing->id,
            'contact_id' => $buyerContact->id,
            'status' => ViewingStatus::Requested,
            'scheduled_at' => $scheduledAt,
        ]);

        $this->actingAs($buyer)
            ->post(route('public.viewing-requests.store', $listing), [
                'scheduled_at' => $scheduledAt->toDateTimeString(),
            ])
            ->assertSessionHasErrors('scheduled_at');

        $this->assertSame(1, Viewing::query()
            ->where('listing_id', $listing->id)
            ->where('contact_id', $buyerContact->id)
            ->where('scheduled_at', $scheduledAt)
            ->count());
        $this->assertSame(0, Inquiry::query()
            ->where('listing_id', $listing->id)
            ->where('contact_id', $buyerContact->id)
            ->count());
    }

    public function test_my_home_and_deal_tracker_are_scoped_to_the_buyer_contact(): void
    {
        $buyerContact = Contact::factory()->create(['role' => ContactRole::Buyer]);
        $buyer = User::factory()->create(['contact_id' => $buyerContact->id]);
        $otherContact = Contact::factory()->create(['role' => ContactRole::Buyer]);
        $visibleListing = Listing::factory()->active()->create(['address' => 'Visible Buyer Home']);
        $hiddenListing = Listing::factory()->active()->create(['address' => 'Hidden Buyer Home']);

        SavedListing::factory()->create([
            'user_id' => $buyer->id,
            'listing_id' => $visibleListing->id,
        ]);
        Viewing::factory()->create([
            'listing_id' => $visibleListing->id,
            'contact_id' => $buyerContact->id,
            'scheduled_at' => now()->addDay(),
        ]);
        Viewing::factory()->create([
            'listing_id' => $hiddenListing->id,
            'contact_id' => $otherContact->id,
            'scheduled_at' => now()->addDay(),
        ]);
        Inquiry::factory()->create([
            'listing_id' => $visibleListing->id,
            'contact_id' => $buyerContact->id,
        ]);
        Inquiry::factory()->create([
            'listing_id' => $hiddenListing->id,
            'contact_id' => $otherContact->id,
        ]);

        $this->actingAs($buyer)
            ->get(route('public.my-home'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('public/my-home')
                ->has('savedListings', 1)
                ->where('savedListings.0.title', 'Visible Buyer Home')
                ->where('nextViewing.listing.title', 'Visible Buyer Home')
            );

        $this->actingAs($buyer)
            ->get(route('public.deal-tracker'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('public/deal-tracker')
                ->where('kpis.inquiries', 1)
                ->where('kpis.viewings', 1)
                ->where('latestInquiry.listing.title', 'Visible Buyer Home')
            );
    }

    public function test_listing_offered_webhook_requires_valid_signature(): void
    {
        config()->set('services.listing_webhook.secret', 'test-secret');

        $listing = Listing::factory()->active()->create();

        $this->postJson(route('webhooks.listings.offered'), [
            'listing_id' => $listing->id,
        ])->assertUnauthorized();

        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_listing_offered_webhook_rejects_stale_timestamp(): void
    {
        config()->set('services.listing_webhook.secret', 'test-secret');

        $listing = Listing::factory()->active()->create();
        $payload = ['listing_id' => $listing->id];

        $this->postSignedListingWebhook($payload, now()->subMinutes(10)->timestamp)
            ->assertUnauthorized();

        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_listing_offered_webhook_rejects_non_public_listing_statuses(): void
    {
        config()->set('services.listing_webhook.secret', 'test-secret');

        $listing = Listing::factory()->create(['status' => ListingStatus::Draft]);

        $this->postSignedListingWebhook(['listing_id' => $listing->id])
            ->assertUnprocessable();

        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_listing_offered_webhook_notifies_verified_buyer_portal_users_only_once(): void
    {
        config()->set('services.listing_webhook.secret', 'test-secret');

        $buyerContact = Contact::factory()->create(['role' => ContactRole::Buyer]);
        $buyer = User::factory()->create(['contact_id' => $buyerContact->id]);
        $listing = Listing::factory()->active()->create(['address' => '42 Palm Avenue']);

        $payload = [
            'listing_id' => $listing->id,
            'event_id' => 'evt-listing-offered-1',
        ];

        $this->postSignedListingWebhook($payload)
            ->assertOk()
            ->assertJson(['notified' => 1]);

        $this->postSignedListingWebhook($payload)
            ->assertOk()
            ->assertJson(['notified' => 0]);

        $this->assertSame(1, $buyer->notifications()->count());

        $notification = $buyer->notifications()->firstOrFail();

        $this->assertSame(ListingOfferedNotification::class, $notification->type);
        $this->assertSame('evt-listing-offered-1', $notification->data['event_id']);
        $this->assertSame('42 Palm Avenue', $notification->data['title']);
        $this->assertSame(route('public.property.show', $listing, false), $notification->data['href']);
    }

    public function test_listing_offered_webhook_does_not_notify_admin_or_agent_users(): void
    {
        config()->set('services.listing_webhook.secret', 'test-secret');

        $adminContact = Contact::factory()->create(['role' => ContactRole::Buyer]);
        $agentContact = Contact::factory()->create(['role' => ContactRole::Buyer]);
        $admin = User::factory()->create(['contact_id' => $adminContact->id]);
        $agent = User::factory()->create(['contact_id' => $agentContact->id]);
        $listing = Listing::factory()->active()->create();

        $admin->assignRole(Role::factory()->create(['key' => 'admin']));
        $agent->assignRole(Role::factory()->create(['key' => 'agent']));

        $this->postSignedListingWebhook(['listing_id' => $listing->id])
            ->assertOk()
            ->assertJson(['notified' => 0]);

        $this->assertSame(0, $admin->notifications()->count());
        $this->assertSame(0, $agent->notifications()->count());
    }

    public function test_public_header_receives_notification_shared_props(): void
    {
        $buyerContact = Contact::factory()->create(['role' => ContactRole::Buyer]);
        $buyer = User::factory()->create(['contact_id' => $buyerContact->id]);
        $listing = Listing::factory()->active()->create(['address' => 'Shared Prop Home']);

        $buyer->notify(new ListingOfferedNotification($listing, 'shared-prop-event'));

        $this->actingAs($buyer)
            ->get(route('public.browse'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('notifications.unreadCount', 1)
                ->where('notifications.recent.0.title', 'Shared Prop Home')
                ->where('notifications.recent.0.href', route('public.property.show', $listing, false))
            );
    }

    public function test_buyer_can_mark_listing_notification_as_read(): void
    {
        $buyerContact = Contact::factory()->create(['role' => ContactRole::Buyer]);
        $buyer = User::factory()->create(['contact_id' => $buyerContact->id]);
        $listing = Listing::factory()->active()->create();

        $buyer->notify(new ListingOfferedNotification($listing, 'mark-read-event'));

        $notification = $buyer->notifications()->firstOrFail();

        $this->actingAs($buyer)
            ->patch(route('public.notifications.update', $notification))
            ->assertRedirect();

        $this->assertSame(0, $buyer->unreadNotifications()->count());
    }

    /**
     * @param  array<string, string>  $payload
     */
    private function postSignedListingWebhook(array $payload, ?int $timestamp = null): TestResponse
    {
        $timestamp ??= now()->timestamp;
        $encodedPayload = json_encode($payload, JSON_THROW_ON_ERROR);
        $signature = hash_hmac('sha256', $timestamp.'.'.$encodedPayload, 'test-secret');

        return $this->withHeaders([
            'X-Webhook-Timestamp' => (string) $timestamp,
            'X-Webhook-Signature' => 'sha256='.$signature,
        ])->postJson(route('webhooks.listings.offered'), $payload);
    }
}
