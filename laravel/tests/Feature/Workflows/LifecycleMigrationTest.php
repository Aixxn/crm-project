<?php

namespace Tests\Feature\Workflows;

use App\Models\Listing;
use App\Models\Offer;
use App\Models\Viewing;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class LifecycleMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_preflight_refuses_conflicting_accepted_offers_including_deleted_without_repairing_data(): void
    {
        DB::statement('DROP INDEX offers_one_accepted_per_listing');
        $listing = Listing::factory()->active()->create();
        Offer::factory()->create(['listing_id' => $listing->id, 'status' => 'Accepted']);
        Offer::factory()->create(['listing_id' => $listing->id, 'status' => 'Accepted', 'deleted_at' => now()]);
        $migration = require database_path('migrations/2026_10_24_065819_add_lifecycle_invariants.php');
        try {
            $migration->up();
            $this->fail('Expected safe preflight failure.');
        } catch (\RuntimeException $error) {
            $this->assertStringContainsString('multiple Accepted Offers', $error->getMessage());
            $this->assertSame(2, Offer::withTrashed()->where('status', 'Accepted')->count());
            $this->assertNull($listing->refresh()->closed_at);
        }
    }

    public function test_preflight_refuses_existing_active_viewing_duplicates_without_deleting_history(): void
    {
        DB::statement('DROP INDEX viewings_unique_active_time');
        $first = Viewing::factory()->create(['status' => 'Requested']);
        Viewing::factory()->create($first->only(['listing_id', 'contact_id', 'agent_id', 'scheduled_at']) + ['status' => 'Scheduled']);
        $migration = require database_path('migrations/2026_10_24_065819_add_lifecycle_invariants.php');
        try {
            $migration->up();
            $this->fail('Expected safe preflight failure.');
        } catch (\RuntimeException $error) {
            $this->assertStringContainsString('duplicate active Viewing times', $error->getMessage());
            $this->assertDatabaseCount('viewings', 2);
        }
    }

    public function test_preflight_requires_explicit_resolution_of_legacy_deleted_submissions(): void
    {
        $offer = Offer::factory()->create(['status' => 'Submitted', 'deleted_at' => now()]);
        $migration = require database_path('migrations/2026_10_24_065819_add_lifecycle_invariants.php');
        try {
            $migration->up();
            $this->fail('Expected explicit legacy resolution.');
        } catch (\RuntimeException $error) {
            $this->assertStringContainsString('Restore and resolve', $error->getMessage());
            $this->assertDatabaseHas('offers', ['id' => $offer->id, 'status' => 'Submitted']);
            $this->assertSoftDeleted($offer);
        }
    }
}
