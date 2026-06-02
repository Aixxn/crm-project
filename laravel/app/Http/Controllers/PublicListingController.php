<?php

namespace App\Http\Controllers;

use App\Enums\ListingStatus;
use App\Models\Listing;
use App\Models\PortalSearch;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicListingController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only([
            'search',
            'property_type',
            'status',
            'min_price',
            'max_price',
            'bedrooms',
            'bathrooms',
        ]);

        $filters = collect($filters)
            ->filter(fn ($value) => $value !== null && $value !== '')
            ->all();

        $listings = $this->publicListingQuery()
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->where('address', 'like', "%{$search}%");
            })
            ->when($filters['property_type'] ?? null, fn (Builder $query, string $type) => $query->where('property_type', $type))
            ->when($filters['status'] ?? null, fn (Builder $query, string $status) => $query->where('status', $status))
            ->when($filters['min_price'] ?? null, fn (Builder $query, string $price) => $query->where('price', '>=', $price))
            ->when($filters['max_price'] ?? null, fn (Builder $query, string $price) => $query->where('price', '<=', $price))
            ->when($filters['bedrooms'] ?? null, fn (Builder $query, string $bedrooms) => $query->where('bedrooms', '>=', $bedrooms))
            ->when($filters['bathrooms'] ?? null, fn (Builder $query, string $bathrooms) => $query->where('bathrooms', '>=', $bathrooms))
            ->latest()
            ->get();

        if ($request->user() && $filters !== []) {
            PortalSearch::create([
                'user_id' => $request->user()->getKey(),
                'name' => $this->searchName($filters),
                'filters' => $filters,
                'last_used_at' => now(),
            ]);
        }

        $savedListingIds = $request->user()
            ? $request->user()->savedListings()->pluck('listing_id')->all()
            : [];

        return Inertia::render('public/browse', [
            'listings' => $listings->map(fn (Listing $listing) => $this->listingCard($listing))->values(),
            'resultCount' => $listings->count(),
            'filters' => $filters,
            'filterOptions' => [
                'propertyTypes' => $this->publicListingQuery()
                    ->whereNotNull('property_type')
                    ->distinct()
                    ->orderBy('property_type')
                    ->pluck('property_type')
                    ->values(),
                'statuses' => [
                    ListingStatus::Active->value,
                    ListingStatus::UnderOffer->value,
                ],
            ],
            'savedListingIds' => $savedListingIds,
        ]);
    }

    public function featured(): Response
    {
        $listing = $this->publicListingQuery()->latest()->first();

        if (! $listing instanceof Listing) {
            return Inertia::render('public/property', [
                'listing' => null,
                'isSaved' => false,
                'submitInquiryUrl' => null,
                'requestViewingUrl' => null,
                'saveListingUrl' => route('public.saved-listings.store', absolute: false),
                'unsaveListingUrl' => null,
            ]);
        }

        return $this->show($listing);
    }

    public function show(Listing $listing): Response
    {
        abort_unless($this->isPublicListing($listing), 404);

        $listing->load([
            'assignedAgent:id,name,email',
            'media' => fn ($query) => $query->orderBy('sort_order'),
        ]);

        $user = request()->user();
        $isSaved = $user
            ? $user->savedListings()->where('listing_id', $listing->getKey())->exists()
            : false;

        return Inertia::render('public/property', [
            'listing' => $this->listingDetail($listing),
            'isSaved' => $isSaved,
            'submitInquiryUrl' => route('public.inquiries.store', $listing, absolute: false),
            'requestViewingUrl' => route('public.viewing-requests.store', $listing, absolute: false),
            'saveListingUrl' => route('public.saved-listings.store', absolute: false),
            'unsaveListingUrl' => route('public.saved-listings.destroy', $listing, absolute: false),
        ]);
    }

    private function publicListingQuery(): Builder
    {
        return Listing::query()
            ->with(['assignedAgent:id,name,email', 'media' => fn ($query) => $query->orderBy('sort_order')])
            ->whereIn('status', [
                ListingStatus::Active->value,
                ListingStatus::UnderOffer->value,
            ]);
    }

    private function isPublicListing(Listing $listing): bool
    {
        return in_array($listing->status, [ListingStatus::Active, ListingStatus::UnderOffer], true)
            && ! $listing->trashed();
    }

    /**
     * @param  array<string, string>  $filters
     */
    private function searchName(array $filters): string
    {
        $parts = collect([
            $filters['search'] ?? null,
            $filters['property_type'] ?? null,
            isset($filters['bedrooms']) ? "{$filters['bedrooms']}+ beds" : null,
            isset($filters['bathrooms']) ? "{$filters['bathrooms']}+ baths" : null,
            isset($filters['min_price']) ? 'from ₱'.number_format((float) $filters['min_price'], 0) : null,
            isset($filters['max_price']) ? 'to ₱'.number_format((float) $filters['max_price'], 0) : null,
        ])->filter()->implode(', ');

        return $parts !== '' ? $parts : 'Property search';
    }

    /**
     * @return array<string, mixed>
     */
    private function listingCard(Listing $listing): array
    {
        return [
            'id' => $listing->getKey(),
            'href' => route('public.property.show', $listing, absolute: false),
            'image' => $listing->media->first()?->url,
            'price' => (float) $listing->price,
            'formattedPrice' => '₱ '.number_format((float) $listing->price, 0),
            'address' => $listing->address,
            'propertyType' => $listing->property_type,
            'bedrooms' => $listing->bedrooms,
            'bathrooms' => $listing->bathrooms !== null ? (float) $listing->bathrooms : null,
            'areaSqft' => $listing->area_sqft,
            'status' => $listing->status->value,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function listingDetail(Listing $listing): array
    {
        return [
            ...$this->listingCard($listing),
            'media' => $listing->media
                ->map(fn ($media) => [
                    'id' => $media->getKey(),
                    'url' => $media->url,
                    'type' => $media->type,
                ])
                ->values(),
            'agent' => [
                'id' => $listing->assignedAgent?->getKey(),
                'name' => $listing->assignedAgent?->name,
                'email' => $listing->assignedAgent?->email,
            ],
        ];
    }
}
