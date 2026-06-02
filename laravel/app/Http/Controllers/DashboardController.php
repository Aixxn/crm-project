<?php

namespace App\Http\Controllers;

use App\Enums\InquiryStatus;
use App\Enums\ListingStatus;
use App\Enums\OfferStatus;
use App\Enums\TaskStatus;
use App\Enums\ViewingStatus;
use App\Models\Contact;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\Note;
use App\Models\Offer;
use App\Models\Task;
use App\Models\User;
use App\Models\Viewing;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
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
                ->whereBetween('updated_at', [now()->startOfMonth(), now()->endOfMonth()])
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
            ->with(['listing:id,address'])
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
            ->with(['listing:id,address'])
            ->latest('updated_at')
            ->limit(4)
            ->get()
            ->map(fn (Offer $offer) => [
                'type' => 'Offer',
                'title' => $offer->listing?->address ?? 'Offer',
                'subtitle' => '$'.number_format((float) $offer->amount),
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
            ->with(['listing:id,address', 'contact:id,first_name,last_name', 'agent:id,name'])
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
            ->withCount(['inquiries', 'viewings', 'offers'])
            ->whereIn('status', [ListingStatus::Active, ListingStatus::UnderOffer])
            ->latest()
            ->limit(5)
            ->get();
    }

    private function listingQuery(User $user): Builder
    {
        return Listing::query()
            ->when(! $user->hasRole('admin'), fn (Builder $query) => $query->where('assigned_agent_id', $user->id));
    }

    private function inquiryQuery(User $user): Builder
    {
        return Inquiry::query()
            ->when(! $user->hasRole('admin'), fn (Builder $query) => $query->whereHas('listing', fn (Builder $query) => $query->where('assigned_agent_id', $user->id)));
    }

    private function viewingQuery(User $user): Builder
    {
        return Viewing::query()
            ->when(! $user->hasRole('admin'), fn (Builder $query) => $query->whereHas('listing', fn (Builder $query) => $query->where('assigned_agent_id', $user->id)));
    }

    private function offerQuery(User $user): Builder
    {
        return Offer::query()
            ->when(! $user->hasRole('admin'), fn (Builder $query) => $query->whereHas('listing', fn (Builder $query) => $query->where('assigned_agent_id', $user->id)));
    }

    private function taskQuery(User $user): Builder
    {
        return Task::query()
            ->when(! $user->hasRole('admin'), fn (Builder $query) => $query->where(function (Builder $query) use ($user): void {
                $query->where(fn (Builder $query) => $query
                    ->where('related_entity_type', Listing::class)
                    ->whereIn('related_entity_id', Listing::query()->select('id')->where('assigned_agent_id', $user->id)))
                    ->orWhere(fn (Builder $query) => $query
                        ->where('related_entity_type', Inquiry::class)
                        ->whereIn('related_entity_id', Inquiry::query()->select('id')->whereHas('listing', fn (Builder $query) => $query->where('assigned_agent_id', $user->id))))
                    ->orWhere(fn (Builder $query) => $query
                        ->where('related_entity_type', Offer::class)
                        ->whereIn('related_entity_id', Offer::query()->select('id')->whereHas('listing', fn (Builder $query) => $query->where('assigned_agent_id', $user->id))))
                    ->orWhere(fn (Builder $query) => $query
                        ->where('related_entity_type', Contact::class)
                        ->whereIn('related_entity_id', $this->accessibleContactIds($user->id)));
            }));
    }

    private function noteQuery(User $user): Builder
    {
        return Note::query()
            ->when(! $user->hasRole('admin'), fn (Builder $query) => $query->where(function (Builder $query) use ($user): void {
                $query->where(fn (Builder $query) => $query
                    ->where('related_entity_type', Listing::class)
                    ->whereIn('related_entity_id', Listing::query()->select('id')->where('assigned_agent_id', $user->id)))
                    ->orWhere(fn (Builder $query) => $query
                        ->where('related_entity_type', Inquiry::class)
                        ->whereIn('related_entity_id', Inquiry::query()->select('id')->whereHas('listing', fn (Builder $query) => $query->where('assigned_agent_id', $user->id))))
                    ->orWhere(fn (Builder $query) => $query
                        ->where('related_entity_type', Offer::class)
                        ->whereIn('related_entity_id', Offer::query()->select('id')->whereHas('listing', fn (Builder $query) => $query->where('assigned_agent_id', $user->id))))
                    ->orWhere(fn (Builder $query) => $query
                        ->where('related_entity_type', Contact::class)
                        ->whereIn('related_entity_id', $this->accessibleContactIds($user->id)));
            }));
    }

    private function accessibleContactIds(int $userId): Builder
    {
        return Contact::query()
            ->select('id')
            ->where(function (Builder $query) use ($userId): void {
                $query->whereHas('ownedListings', fn (Builder $query) => $query->where('assigned_agent_id', $userId))
                    ->orWhereHas('inquiries.listing', fn (Builder $query) => $query->where('assigned_agent_id', $userId))
                    ->orWhereHas('viewings.listing', fn (Builder $query) => $query->where('assigned_agent_id', $userId))
                    ->orWhereHas('offers.listing', fn (Builder $query) => $query->where('assigned_agent_id', $userId));
            });
    }
}
