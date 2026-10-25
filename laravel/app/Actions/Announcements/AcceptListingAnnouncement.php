<?php

namespace App\Actions\Announcements;

use App\Models\Listing;
use App\Models\User;
use App\Notifications\ListingOfferedNotification;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use stdClass;

class AcceptListingAnnouncement
{
    public function handle(string $eventId, string $listingId): string
    {
        $hash = hash('sha256', json_encode(['event_id' => $eventId, 'listing_id' => $listingId], JSON_THROW_ON_ERROR));
        try {
            $id = DB::transaction(function () use ($eventId, $listingId, $hash): string {
                DB::table('listing_announcements')->where('producer', 'listing-webhook-v2')->where('event_id', $eventId)->update(['updated_at' => now()]);
                $existing = DB::table('listing_announcements')->where('producer', 'listing-webhook-v2')->where('event_id', $eventId)->first();
                if ($existing) {
                    return $this->replay($existing, $hash);
                }
                $listing = Listing::query()->published()->lockForUpdate()->find($listingId);
                abort_unless($listing, 422, 'Listing is not available for buyer notifications.');
                $id = (string) Str::uuid();
                DB::table('listing_announcements')->insert([
                    'id' => $id,
                    'producer' => 'listing-webhook-v2',
                    'event_id' => $eventId,
                    'payload_hash' => $hash,
                    'listing_id' => $listingId,
                    'notification_data' => json_encode((new ListingOfferedNotification($listing, $eventId))->toArray(new User), JSON_THROW_ON_ERROR),
                    'recipient_max_id' => User::query()->max('id') ?? 0,
                    'recipient_cursor' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                return $id;
            }, 3);
        } catch (UniqueConstraintViolationException $error) {
            $existing = DB::table('listing_announcements')->where('producer', 'listing-webhook-v2')->where('event_id', $eventId)->first();
            if (! $existing) {
                throw $error;
            }
            $id = $this->replay($existing, $hash);
        }
        DB::afterCommit(fn () => app(DispatchListingAnnouncement::class)->handle($id));

        return $id;
    }

    private function replay(stdClass $receipt, string $hash): string
    {
        abort_unless(hash_equals($receipt->payload_hash, $hash), 409, 'Event identity was already used for a different listing.');

        return $receipt->id;
    }
}
