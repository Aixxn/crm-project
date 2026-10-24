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
use App\Models\Permission;
use App\Models\Role;
use App\Models\Task;
use App\Models\User;
use App\Models\Viewing;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
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
            'closed_at' => now(),
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
        $role = Role::factory()->create(['key' => 'agent']);
        foreach (['listing.read', 'inquiry.read'] as $permission) {
            $role->addPermission(Permission::factory()->create(['key' => $permission]));
        }
        $agent->assignRole($role);
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

    public function test_closed_month_uses_manila_boundaries_and_ignores_legacy_unknown_dates(): void
    {
        $this->travelTo(Carbon::parse('2026-10-31T16:30:00Z'));
        $admin = $this->adminUser();
        Listing::factory()->create(['status' => ListingStatus::Closed, 'closed_at' => '2026-10-31 15:59:59']);
        $inMonth = Listing::factory()->create(['status' => ListingStatus::Closed, 'closed_at' => '2026-10-31 16:00:00', 'updated_at' => '2025-01-01 00:00:00']);
        Listing::factory()->create(['status' => ListingStatus::Closed, 'closed_at' => '2026-11-30 16:00:00']);
        Listing::factory()->create(['status' => ListingStatus::Closed, 'closed_at' => null]);
        Listing::factory()->create(['status' => ListingStatus::ClosedLost, 'closed_at' => null]);
        $this->actingAs($admin)->get(route('dashboard'))->assertInertia(fn (AssertableInertia $page) => $page->where('kpis.closedThisMonth', 1));
        $inMonth->update(['address' => 'Metadata correction']);
        $this->get(route('dashboard'))->assertInertia(fn (AssertableInertia $page) => $page->where('kpis.closedThisMonth', 1));
    }

    private function adminUser(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Role::factory()->create(['key' => 'admin']));

        return $user;
    }
}
