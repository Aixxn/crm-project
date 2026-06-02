<?php

namespace App\Http\Controllers;

use App\Enums\ListingStatus;
use App\Enums\ViewingStatus;
use App\Models\Listing;
use App\Models\Viewing;
use App\Services\BuyerPortalScope;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PublicViewingRequestController extends Controller
{
    public function __construct(private BuyerPortalScope $buyerPortalScope) {}

    public function store(Request $request, Listing $listing): RedirectResponse
    {
        abort_unless($this->isPublicListing($listing), 404);

        $validated = $request->validate([
            'scheduled_at' => ['required', 'date', 'after:now'],
        ]);

        $contact = $this->buyerPortalScope->ensureContact($request->user());

        Viewing::create([
            'listing_id' => $listing->getKey(),
            'contact_id' => $contact->getKey(),
            'agent_id' => $listing->assigned_agent_id,
            'status' => ViewingStatus::Requested,
            'scheduled_at' => $validated['scheduled_at'],
        ]);

        return back()->with('success', 'Viewing request sent to the listing agent.');
    }

    private function isPublicListing(Listing $listing): bool
    {
        return in_array($listing->status, [ListingStatus::Active, ListingStatus::UnderOffer], true)
            && ! $listing->trashed();
    }
}
