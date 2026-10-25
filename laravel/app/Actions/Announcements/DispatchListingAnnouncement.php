<?php

namespace App\Actions\Announcements;

use App\Jobs\DeliverListingAnnouncement;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;
use Throwable;

class DispatchListingAnnouncement
{
    public function handle(string $receiptId): bool
    {
        try {
            Queue::connection('database')->push(new DeliverListingAnnouncement($receiptId), queue: 'announcements');

            return true;
        } catch (Throwable) {
            try {
                Log::error('Listing announcement queue submission failed.', ['receipt_id' => $receiptId, 'operation' => 'queue']);
            } catch (Throwable) {
                // The durable incomplete receipt remains recoverable when logging also fails.
            }

            return false;
        }
    }
}
