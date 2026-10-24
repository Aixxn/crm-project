<?php

namespace App\Actions\Inquiries;

use App\Actions\Lifecycle\RecordTransition;
use App\Enums\InquiryStatus;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\User;
use App\Services\BuyerPortalScope;
use Illuminate\Support\Facades\DB;

class CreatePublicInquiry
{
    public function __construct(private BuyerPortalScope $portal, private RecordTransition $history) {}

    /** @param array{intent: string, budget?: mixed, message?: ?string} $attributes */
    public function handle(User $actor, Listing $listing, array $attributes): Inquiry
    {
        return DB::transaction(function () use ($actor, $listing, $attributes): Inquiry {
            $listing = Listing::query()->published()->lockForUpdate()->findOrFail($listing->id);
            $actor = User::query()->lockForUpdate()->findOrFail($actor->id);
            abort_unless($actor->hasVerifiedEmail(), 403);
            $contact = $this->portal->contact($actor);
            $inquiry = Inquiry::query()->create([
                'listing_id' => $listing->id, 'contact_id' => $contact->id,
                'status' => InquiryStatus::New, 'source' => 'Public Portal',
                'intent' => $attributes['intent'], 'budget' => $attributes['budget'] ?? null, 'message' => $attributes['message'] ?? null,
            ]);
            $this->history->handle($actor, $inquiry, null, operation: 'create');

            return $inquiry;
        }, 3);
    }
}
