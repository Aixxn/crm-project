<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('listing_announcements', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('producer', 40);
            $table->string('event_id', 120);
            $table->char('payload_hash', 64);
            $table->uuid('listing_id');
            $table->json('notification_data');
            $table->unsignedBigInteger('recipient_max_id');
            $table->unsignedBigInteger('recipient_cursor')->default(0);
            $table->timestamp('completed_at')->nullable()->index();
            $table->timestamps();
            $table->unique(['producer', 'event_id']);
        });
        Schema::create('listing_announcement_deliveries', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('announcement_id')->constrained('listing_announcements');
            $table->unsignedBigInteger('user_id');
            $table->string('outcome', 24);
            $table->timestamp('created_at');
            $table->unique(['announcement_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('listing_announcement_deliveries');
        Schema::dropIfExists('listing_announcements');
    }
};
