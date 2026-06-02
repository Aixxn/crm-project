<?php

namespace App\Http\Controllers;

use App\Enums\InquiryStatus;
use App\Enums\ListingStatus;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Services\BuyerPortalScope;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PublicInquiryController extends Controller
{
    public function __construct(private BuyerPortalScope $buyerPortalScope) {}

    public function store(Request $request, Listing $listing): RedirectResponse
    {
        abort_unless($this->isPublicListing($listing), 404);

        $validated = $request->validate([
            'intent' => ['required', 'string', 'in:buy,rent'],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'message' => ['nullable', 'string', 'max:2000'],
        ]);

        $contact = $this->buyerPortalScope->ensureContact($request->user());

        Inquiry::create([
            'listing_id' => $listing->getKey(),
            'contact_id' => $contact->getKey(),
            'status' => InquiryStatus::New,
            'source' => 'Public Portal',
            'intent' => $validated['intent'],
            'budget' => $validated['budget'] ?? null,
            'message' => $validated['message'] ?? null,
        ]);

        return back()->with('success', 'Inquiry sent to the listing agent.');
    }

    private function isPublicListing(Listing $listing): bool
    {
        return in_array($listing->status, [ListingStatus::Active, ListingStatus::UnderOffer], true)
            && ! $listing->trashed();
    }
}
