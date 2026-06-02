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
use App\Models\SavedListing;
use App\Models\User;
use App\Models\Viewing;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

        $this->actingAs($buyer)
            ->post(route('public.viewing-requests.store', $listing), [
                'scheduled_at' => now()->addDays(2)->toDateTimeString(),
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('viewings', [
            'listing_id' => $listing->id,
            'contact_id' => $buyerContact->id,
            'agent_id' => $agent->id,
            'status' => ViewingStatus::Requested->value,
        ]);
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
}
