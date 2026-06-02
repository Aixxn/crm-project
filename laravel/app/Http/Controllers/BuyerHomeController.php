<?php

namespace App\Http\Controllers;

use App\Enums\ListingStatus;
use App\Models\Listing;
use App\Models\PortalSearch;
use App\Models\SavedListing;
use App\Models\Viewing;
use App\Services\BuyerPortalScope;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BuyerHomeController extends Controller
{
    public function __construct(private BuyerPortalScope $buyerPortalScope) {}

    public function __invoke(Request $request): Response
    {
        $contact = $this->buyerPortalScope->ensureContact($request->user());

        $savedListings = $request->user()
            ->savedListings()
            ->with(['listing.media' => fn ($query) => $query->orderBy('sort_order')])
            ->latest()
            ->take(8)
            ->get();

        $nextViewing = $contact->viewings()
            ->with(['listing.media' => fn ($query) => $query->orderBy('sort_order'), 'agent:id,name,email'])
            ->where('scheduled_at', '>=', now())
            ->orderBy('scheduled_at')
            ->get()
            ->first(fn (Viewing $viewing) => $viewing->listing && $this->isPublicListing($viewing->listing));

        return Inertia::render('public/my-home', [
            'profile' => [
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'phone' => $contact->phone,
            ],
            'nextViewing' => $nextViewing ? $this->viewingSummary($nextViewing) : null,
            'savedListings' => $savedListings
                ->map(fn (SavedListing $savedListing) => $this->listingSummary($savedListing->listing))
                ->filter()
                ->values(),
            'savedListingsTotal' => $request->user()->savedListings()->count(),
            'recentSearches' => $request->user()
                ->portalSearches()
                ->latest('last_used_at')
                ->take(6)
                ->get()
                ->map(fn (PortalSearch $search) => [
                    'id' => $search->getKey(),
                    'name' => $search->name,
                    'filters' => $search->filters,
                ])
                ->values(),
        ]);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function listingSummary(?Listing $listing): ?array
    {
        if (! $listing instanceof Listing) {
            return null;
        }

        if (! $this->isPublicListing($listing)) {
            return null;
        }

        return [
            'id' => $listing->getKey(),
            'href' => route('public.property.show', $listing, absolute: false),
            'title' => $listing->address,
            'price' => '₱ '.number_format((float) $listing->price, 0),
            'image' => $listing->media->first()?->url,
            'status' => $listing->status->value,
        ];
    }

    private function isPublicListing(Listing $listing): bool
    {
        return in_array($listing->status, [ListingStatus::Active, ListingStatus::UnderOffer], true)
            && ! $listing->trashed();
    }

    /**
     * @return array<string, mixed>
     */
    private function viewingSummary(Viewing $viewing): array
    {
        return [
            'id' => $viewing->getKey(),
            'status' => $viewing->status->value,
            'scheduledAt' => $viewing->scheduled_at?->toIso8601String(),
            'listing' => $this->listingSummary($viewing->listing),
            'agent' => [
                'name' => $viewing->agent?->name,
                'email' => $viewing->agent?->email,
            ],
        ];
    }
}
