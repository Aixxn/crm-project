<?php

namespace App\Http\Controllers;

use App\Enums\InquiryStatus;
use App\Enums\ListingStatus;
use App\Enums\ViewingStatus;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\Viewing;
use App\Services\BuyerPortalScope;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

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
        $scheduledAt = Carbon::parse($validated['scheduled_at']);

        $duplicateViewingExists = Viewing::query()
            ->where('listing_id', $listing->getKey())
            ->where('contact_id', $contact->getKey())
            ->where('scheduled_at', $scheduledAt)
            ->whereIn('status', [
                ViewingStatus::Requested->value,
                ViewingStatus::Scheduled->value,
            ])
            ->exists();

        if ($duplicateViewingExists) {
            Inertia::flash('toast', ['type' => 'warning', 'message' => __('You already requested this viewing time.')]);

            return back()->withErrors([
                'scheduled_at' => __('You already requested this viewing time.'),
            ]);
        }

        $viewingMessage = __('Viewing requested for :time.', [
            'time' => $scheduledAt->format('M j, Y g:i A'),
        ]);

        $inquiry = Inquiry::query()
            ->where('listing_id', $listing->getKey())
            ->where('contact_id', $contact->getKey())
            ->whereIn('status', [
                InquiryStatus::New->value,
                InquiryStatus::Contacted->value,
                InquiryStatus::Qualified->value,
            ])
            ->latest()
            ->first();

        if ($inquiry instanceof Inquiry) {
            $inquiry->update([
                'message' => trim(collect([$inquiry->message, $viewingMessage])
                    ->filter()
                    ->implode("\n\n")),
            ]);
        } else {
            Inquiry::create([
                'listing_id' => $listing->getKey(),
                'contact_id' => $contact->getKey(),
                'status' => InquiryStatus::New,
                'source' => 'Public Portal',
                'intent' => 'buy',
                'budget' => null,
                'message' => $viewingMessage,
            ]);
        }

        Viewing::create([
            'listing_id' => $listing->getKey(),
            'contact_id' => $contact->getKey(),
            'agent_id' => $listing->assigned_agent_id,
            'status' => ViewingStatus::Requested,
            'scheduled_at' => $scheduledAt,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Viewing request successful.')]);

        return back();
    }

    private function isPublicListing(Listing $listing): bool
    {
        return in_array($listing->status, [ListingStatus::Active, ListingStatus::UnderOffer], true)
            && ! $listing->trashed();
    }
}
