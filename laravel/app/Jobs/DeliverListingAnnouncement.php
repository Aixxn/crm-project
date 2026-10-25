<?php

namespace App\Jobs;

use App\Actions\Announcements\DeliverListingAnnouncementChunk;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class DeliverListingAnnouncement implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    public int $timeout = 60;

    public function __construct(public string $receiptId)
    {
        $this->onConnection('database')->onQueue('announcements');
    }

    public function handle(DeliverListingAnnouncementChunk $delivery): void
    {
        $delivery->handle($this->receiptId);
    }

    public function backoff(): array
    {
        return [5, 30, 60, 120];
    }
}
