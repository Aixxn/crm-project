<?php

namespace App\Http\Controllers;

use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\Offer;
use App\Models\Viewing;
use App\Services\BuyerPortalScope;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BuyerDealTrackerController extends Controller
{
    public function __construct(private BuyerPortalScope $buyerPortalScope) {}

    public function __invoke(Request $request): Response
    {
        $contact = $this->buyerPortalScope->contact($request->user());

        $offers = $contact->offers()
            ->with(['listing.media' => fn ($query) => $query->orderBy('sort_order')])
            ->latest()
            ->get()
            ->filter(fn (Offer $offer) => $offer->listing && $offer->listing->isPublished())
            ->values();

        $viewings = $contact->viewings()
            ->with(['listing.media' => fn ($query) => $query->orderBy('sort_order')])
            ->latest('scheduled_at')
            ->get()
            ->filter(fn (Viewing $viewing) => $viewing->listing && $viewing->listing->isPublished())
            ->values();

        $inquiries = $contact->inquiries()
            ->with(['listing.media' => fn ($query) => $query->orderBy('sort_order')])
            ->latest()
            ->get()
            ->filter(fn (Inquiry $inquiry) => $inquiry->listing && $inquiry->listing->isPublished())
            ->values();

        return Inertia::render('public/deal-tracker', [
            'kpis' => [
                'activeOffers' => $offers->count(),
                'inquiries' => $inquiries->count(),
                'viewings' => $viewings->count(),
            ],
            'activeOffer' => $offers->first() ? $this->offerSummary($offers->first()) : null,
            'upcomingViewing' => $viewings->first() ? $this->viewingSummary($viewings->first()) : null,
            'latestInquiry' => $inquiries->first() ? $this->inquirySummary($inquiries->first()) : null,
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

        if (! $listing->isPublished()) {
            return null;
        }

        return [
            'id' => $listing->getKey(),
            'href' => route('public.property.show', $listing, absolute: false),
            'title' => $listing->address,
            'price' => '₱ '.number_format((float) $listing->price, 0),
            'image' => $listing->media->first()?->url,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function offerSummary(Offer $offer): array
    {
        return [
            'id' => $offer->getKey(),
            'status' => $offer->status->value,
            'amount' => '₱ '.number_format((float) $offer->amount, 0),
            'listing' => $this->listingSummary($offer->listing),
            'updatedAt' => $offer->updated_at?->diffForHumans(),
        ];
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
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function inquirySummary(Inquiry $inquiry): array
    {
        return [
            'id' => $inquiry->getKey(),
            'status' => $inquiry->status->value,
            'message' => $inquiry->message,
            'listing' => $this->listingSummary($inquiry->listing),
            'createdAt' => $inquiry->created_at?->diffForHumans(),
        ];
    }
}
