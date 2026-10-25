<?php

namespace App\Console\Commands;

use App\Actions\Announcements\DispatchListingAnnouncement;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RecoverListingAnnouncements extends Command
{
    protected $signature = 'announcements:recover';

    protected $description = 'Queue incomplete listing announcements, including interrupted or failed dispatches';

    public function handle(DispatchListingAnnouncement $dispatch): int
    {
        $failed = false;
        DB::table('listing_announcements')->whereNull('completed_at')->orderBy('id')->chunkById(100, function ($receipts) use ($dispatch, &$failed): void {
            foreach ($receipts as $receipt) {
                $failed = ! $dispatch->handle($receipt->id) || $failed;
            }
        }, 'id');
        $this->info($failed ? 'Some submissions failed. Incomplete receipts remain available for recovery.' : 'Incomplete announcements scheduled.');

        return $failed ? self::FAILURE : self::SUCCESS;
    }
}
