<?php

namespace Tests\Feature;

use App\Enums\InquiryStatus;
use App\Enums\ListingStatus;
use App\Enums\OfferStatus;
use App\Enums\TaskStatus;
use App\Enums\ViewingStatus;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\Note;
use App\Models\Offer;
use App\Models\Role;
use App\Models\Task;
use App\Models\User;
use App\Models\Viewing;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_crm_users_can_visit_the_dashboard(): void
    {
        $user = User::factory()->create();
        $user->assignRole(Role::factory()->create(['key' => 'agent']));
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertOk();
    }

    public function test_dashboard_renders_crm_overview_metrics(): void
    {
        $admin = $this->adminUser();
        $listing = Listing::factory()->create([
            'status' => ListingStatus::Active,
            'updated_at' => now(),
        ]);

        Inquiry::factory()->create([
            'listing_id' => $listing->id,
            'status' => InquiryStatus::New,
        ]);
        Viewing::factory()->create([
            'listing_id' => $listing->id,
            'status' => ViewingStatus::Scheduled,
            'scheduled_at' => now()->addDay(),
        ]);
        Offer::factory()->create([
            'listing_id' => $listing->id,
            'status' => OfferStatus::Submitted,
        ]);
        Task::factory()->create([
            'assignee_id' => $admin->id,
            'status' => TaskStatus::Open,
            'related_entity_type' => Listing::class,
            'related_entity_id' => $listing->id,
        ]);
        Note::factory()->create([
            'author_id' => $admin->id,
            'related_entity_type' => Listing::class,
            'related_entity_id' => $listing->id,
        ]);
        Listing::factory()->create([
            'status' => ListingStatus::Closed,
            'updated_at' => now(),
        ]);

        $this->actingAs($admin)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('dashboard')
                ->where('kpis.activeListings', 1)
                ->where('kpis.newInquiries', 1)
                ->where('kpis.upcomingViewings', 1)
                ->where('kpis.pendingOffers', 1)
                ->where('kpis.closedThisMonth', 1)
                ->has('recentActivity')
                ->has('upcomingViewings', 1)
                ->has('openTasks', 1)
                ->has('activeListings', 1)
            );
    }

    public function test_dashboard_is_scoped_to_agent_assigned_listings(): void
    {
        $agent = User::factory()->create();
        $agent->assignRole(Role::factory()->create(['key' => 'agent']));
        $visibleListing = Listing::factory()->create([
            'assigned_agent_id' => $agent->id,
            'status' => ListingStatus::Active,
        ]);
        $hiddenListing = Listing::factory()->create(['status' => ListingStatus::Active]);

        Inquiry::factory()->create([
            'listing_id' => $visibleListing->id,
            'status' => InquiryStatus::New,
        ]);
        Inquiry::factory()->create([
            'listing_id' => $hiddenListing->id,
            'status' => InquiryStatus::New,
        ]);

        $this->actingAs($agent)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('dashboard')
                ->where('kpis.activeListings', 1)
                ->where('kpis.newInquiries', 1)
                ->has('activeListings', 1)
                ->where('activeListings.0.id', $visibleListing->id)
            );
    }

    private function adminUser(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Role::factory()->create(['key' => 'admin']));

        return $user;
    }
}
