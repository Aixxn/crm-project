<?php

namespace App\Http\Controllers;

use App\Enums\InquiryStatus;
use App\Enums\ListingStatus;
use App\Enums\OfferStatus;
use App\Enums\TaskStatus;
use App\Enums\ViewingStatus;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\Note;
use App\Models\Offer;
use App\Models\Task;
use App\Models\User;
use App\Models\Viewing;
use App\Services\OwnershipScope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private OwnershipScope $ownershipScope) {}

    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('dashboard', [
            'kpis' => $this->kpis($user),
            'recentActivity' => $this->recentActivity($user),
            'upcomingViewings' => $this->upcomingViewings($user),
            'openTasks' => $this->openTasks($user),
            'activeListings' => $this->activeListings($user),
        ]);
    }

    /**
     * @return array<string, int>
     */
    private function kpis(User $user): array
    {
        return [
            'activeListings' => $this->listingQuery($user)
                ->whereIn('status', [ListingStatus::Active, ListingStatus::UnderOffer])
                ->count(),
            'newInquiries' => $this->inquiryQuery($user)
                ->where('status', InquiryStatus::New)
                ->count(),
            'upcomingViewings' => $this->viewingQuery($user)
                ->where('status', ViewingStatus::Scheduled)
                ->where('scheduled_at', '>=', now())
                ->count(),
            'pendingOffers' => $this->offerQuery($user)
                ->where('status', OfferStatus::Submitted)
                ->count(),
            'closedThisMonth' => $this->listingQuery($user)
                ->where('status', ListingStatus::Closed)
                ->where('closed_at', '>=', now(config('app.agency_timezone', 'Asia/Manila'))->startOfMonth()->utc())
                ->where('closed_at', '<', now(config('app.agency_timezone', 'Asia/Manila'))->startOfMonth()->addMonth()->utc())
                ->count(),
        ];
    }

    /**
     * @return Collection<int, array{type: string, title: string, subtitle: string, status: string|null, href: string, occurred_at: string}>
     */
    private function recentActivity(User $user): Collection
    {
        $listings = $this->listingQuery($user)
            ->select(['id', 'address', 'status', 'updated_at'])
            ->latest('updated_at')
            ->limit(4)
            ->get()
            ->map(fn (Listing $listing) => [
                'type' => 'Listing',
                'title' => $listing->address,
                'subtitle' => 'Listing updated',
                'status' => $listing->status->value,
                'href' => route('listings.show', $listing),
                'occurred_at' => $listing->updated_at->toISOString(),
            ]);

        $inquiries = $this->inquiryQuery($user)
            ->with(['listing' => $this->ownershipScope->readRelation($user)])
            ->latest('updated_at')
            ->limit(4)
            ->get()
            ->map(fn (Inquiry $inquiry) => [
                'type' => 'Inquiry',
                'title' => $inquiry->listing?->address ?? 'Inquiry',
                'subtitle' => trim("{$inquiry->source} {$inquiry->intent}"),
                'status' => $inquiry->status->value,
                'href' => route('inquiries.show', $inquiry),
                'occurred_at' => $inquiry->updated_at->toISOString(),
            ]);

        $offers = $this->offerQuery($user)
            ->with(['listing' => $this->ownershipScope->readRelation($user)])
            ->latest('updated_at')
            ->limit(4)
            ->get()
            ->map(fn (Offer $offer) => [
                'type' => 'Offer',
                'title' => $offer->listing?->address ?? 'Offer',
                'subtitle' => '₱'.number_format((float) $offer->amount),
                'status' => $offer->status->value,
                'href' => route('offers.show', $offer),
                'occurred_at' => $offer->updated_at->toISOString(),
            ]);

        $notes = $this->noteQuery($user)
            ->with(['author:id,name'])
            ->latest('updated_at')
            ->limit(4)
            ->get()
            ->map(fn (Note $note) => [
                'type' => 'Note',
                'title' => str($note->body)->limit(54)->toString(),
                'subtitle' => $note->author?->name ?? 'CRM note',
                'status' => null,
                'href' => route('notes.show', $note),
                'occurred_at' => $note->updated_at->toISOString(),
            ]);

        return $listings
            ->concat($inquiries)
            ->concat($offers)
            ->concat($notes)
            ->sortByDesc('occurred_at')
            ->take(8)
            ->values();
    }

    /**
     * @return Collection<int, Viewing>
     */
    private function upcomingViewings(User $user): Collection
    {
        return $this->viewingQuery($user)
            ->with(['listing' => $this->ownershipScope->readRelation($user), 'contact' => $this->ownershipScope->readRelation($user), 'agent:id,name'])
            ->where('status', ViewingStatus::Scheduled)
            ->where('scheduled_at', '>=', now())
            ->orderBy('scheduled_at')
            ->limit(5)
            ->get();
    }

    /**
     * @return Collection<int, Task>
     */
    private function openTasks(User $user): Collection
    {
        return $this->taskQuery($user)
            ->with(['assignee:id,name'])
            ->whereIn('status', [TaskStatus::Open, TaskStatus::InProgress])
            ->orderByRaw('due_date is null')
            ->orderBy('due_date')
            ->latest()
            ->limit(5)
            ->get();
    }

    /**
     * @return Collection<int, Listing>
     */
    private function activeListings(User $user): Collection
    {
        return $this->listingQuery($user)
            ->withCount(array_fill_keys(['inquiries', 'viewings', 'offers'], $this->ownershipScope->readRelation($user)))
            ->whereIn('status', [ListingStatus::Active, ListingStatus::UnderOffer])
            ->latest()
            ->limit(5)
            ->get();
    }

    private function listingQuery(User $user): Builder
    {
        return $this->ownershipScope->scope($user, Listing::query(), 'listing.read');
    }

    private function inquiryQuery(User $user): Builder
    {
        return $this->ownershipScope->scope($user, Inquiry::query(), 'inquiry.read');
    }

    private function viewingQuery(User $user): Builder
    {
        return $this->ownershipScope->scope($user, Viewing::query(), 'viewing.read');
    }

    private function offerQuery(User $user): Builder
    {
        return $this->ownershipScope->scope($user, Offer::query(), 'offer.read');
    }

    private function taskQuery(User $user): Builder
    {
        return $this->ownershipScope->scope($user, Task::query(), 'task.read');
    }

    private function noteQuery(User $user): Builder
    {
        return $this->ownershipScope->scope($user, Note::query(), 'note.read');
    }
}
