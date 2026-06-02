<?php

namespace App\Http\Controllers;

use App\Enums\ListingStatus;
use App\Models\Listing;
use App\Models\SavedListing;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SavedListingController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'listing_id' => ['required', 'uuid', 'exists:listings,id'],
        ]);

        $listing = Listing::query()->findOrFail($validated['listing_id']);
        abort_unless($this->isPublicListing($listing), 404);

        $savedListing = SavedListing::withTrashed()->firstOrCreate([
            'user_id' => $request->user()->getKey(),
            'listing_id' => $listing->getKey(),
        ]);

        if ($savedListing->trashed()) {
            $savedListing->restore();
        }

        return back()->with('success', 'Listing saved.');
    }

    public function destroy(Request $request, Listing $listing): RedirectResponse
    {
        $request->user()
            ->savedListings()
            ->where('listing_id', $listing->getKey())
            ->delete();

        return back()->with('success', 'Listing removed from saved homes.');
    }

    private function isPublicListing(Listing $listing): bool
    {
        return in_array($listing->status, [ListingStatus::Active, ListingStatus::UnderOffer], true)
            && ! $listing->trashed();
    }
}
