<?php

namespace App\Actions\Announcements;

use App\Enums\ContactRole;
use App\Models\Listing;
use App\Models\User;
use App\Notifications\ListingOfferedNotification;
use Illuminate\Support\Facades\DB;
use Ramsey\Uuid\Uuid;

class DeliverListingAnnouncementChunk
{
    public const CHUNK_SIZE = 50;

    public function handle(string $receiptId): void
    {
        $more = DB::transaction(function () use ($receiptId): bool {
            // Acquire write intent before reading a cursor, including on deferred SQLite transactions.
            DB::table('listing_announcements')->where('id', $receiptId)->whereNull('completed_at')->update(['updated_at' => now()]);
            $receipt = DB::table('listing_announcements')->where('id', $receiptId)->lockForUpdate()->first();
            if (! $receipt || $receipt->completed_at !== null) {
                return false;
            }
            $listing = Listing::query()->published()->lockForUpdate()->find($receipt->listing_id);
            $users = User::query()->where('id', '>', $receipt->recipient_cursor)->where('id', '<=', $receipt->recipient_max_id)
                ->orderBy('id')->limit(self::CHUNK_SIZE)->lockForUpdate()->get();
            $cursor = $receipt->recipient_cursor;
            foreach ($users as $user) {
                $cursor = $user->id;
                if (DB::table('listing_announcement_deliveries')->where('announcement_id', $receiptId)->where('user_id', $user->id)->exists()) {
                    continue;
                }
                $outcome = ! $listing ? 'unpublished' : (! $this->eligible($user) ? 'ineligible' : 'delivered');
                $notificationId = Uuid::uuid5(Uuid::NAMESPACE_URL, 'listing-announcement/'.$receiptId.'/'.$user->id)->toString();
                if ($outcome === 'delivered') {
                    DB::table('notifications')->insert([
                        'id' => $notificationId,
                        'type' => ListingOfferedNotification::class,
                        'notifiable_type' => $user->getMorphClass(),
                        'notifiable_id' => $user->id,
                        'data' => $receipt->notification_data,
                        'read_at' => null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
                DB::table('listing_announcement_deliveries')->insert([
                    'id' => $notificationId, 'announcement_id' => $receiptId, 'user_id' => $user->id, 'outcome' => $outcome, 'created_at' => now(),
                ]);
            }
            $complete = $users->count() < self::CHUNK_SIZE || $cursor >= $receipt->recipient_max_id;
            DB::table('listing_announcements')->where('id', $receiptId)->update([
                'recipient_cursor' => $cursor, 'completed_at' => $complete ? now() : null, 'updated_at' => now(),
            ]);

            return ! $complete;
        }, 3);
        if ($more) {
            DB::afterCommit(fn () => app(DispatchListingAnnouncement::class)->handle($receiptId));
        }
    }

    private function eligible(User $user): bool
    {
        return $user->hasVerifiedEmail() && $user->contact?->role === ContactRole::Buyer && ! $user->hasCrmAccess();
    }
}
