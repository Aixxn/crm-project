<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! in_array(DB::getDriverName(), ['sqlite', 'pgsql'], true)) {
            throw new RuntimeException('Lifecycle constraints require SQLite or PostgreSQL. Select and verify the production engine before migrating.');
        }
        if (DB::table('offers')->where('status', 'Submitted')->whereNotNull('deleted_at')->exists()) {
            throw new RuntimeException('Restore and resolve soft-deleted Submitted Offers before migrating. No records were changed.');
        }
        if (DB::table('offers')->where('status', 'Accepted')->groupBy('listing_id')->havingRaw('COUNT(*) > 1')->exists()) {
            throw new RuntimeException('Resolve multiple Accepted Offers per Listing, including deleted offers, before migrating. No records were changed.');
        }
        if (DB::table('viewings')->whereNull('deleted_at')->whereIn('status', ['Requested', 'Scheduled'])->groupBy('listing_id', 'contact_id', 'scheduled_at')->havingRaw('COUNT(*) > 1')->exists()) {
            throw new RuntimeException('Resolve duplicate active Viewing times per Listing and Contact before migrating. No records were changed.');
        }
        Schema::table('listings', function (Blueprint $table): void {
            $table->dateTime('closed_at')->nullable()->index();
        });
        Schema::create('state_transitions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('actor_id')->constrained('users');
            $table->string('entity_type');
            $table->uuid('entity_id');
            $table->string('old_state')->nullable();
            $table->string('new_state');
            $table->dateTime('occurred_at');
            $table->text('reason')->nullable();
            $table->string('operation')->default('transition');
            $table->index(['entity_type', 'entity_id']);
        });
        DB::statement("CREATE UNIQUE INDEX offers_one_accepted_per_listing ON offers (listing_id) WHERE status = 'Accepted'");
        DB::statement("CREATE UNIQUE INDEX viewings_unique_active_time ON viewings (listing_id, contact_id, scheduled_at) WHERE deleted_at IS NULL AND status IN ('Requested', 'Scheduled')");
    }

    public function down(): void
    {
        DB::statement('DROP INDEX offers_one_accepted_per_listing');
        DB::statement('DROP INDEX viewings_unique_active_time');
        Schema::dropIfExists('state_transitions');
        Schema::table('listings', fn (Blueprint $table) => $table->dropColumn('closed_at'));
    }
};
