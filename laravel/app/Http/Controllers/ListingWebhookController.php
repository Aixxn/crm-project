<?php

namespace App\Http\Controllers;

use App\Actions\Announcements\AcceptListingAnnouncement;
use App\Enums\ContactRole;
use App\Models\Listing;
use App\Models\User;
use App\Notifications\ListingOfferedNotification;
use App\Services\ListingWebhookSignature;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\Response;

class ListingWebhookController extends Controller
{
    public function offered(Request $request): JsonResponse
    {
        app(ListingWebhookSignature::class)->validate($request);

        $validated = $request->validate([
            'listing_id' => ['required', 'string', 'exists:listings,id'],
            'event_id' => ['nullable', 'string', 'max:120'],
        ]);

        $listing = Listing::query()
            ->whereKey($validated['listing_id'])
            ->published()
            ->first();

        if (! $listing instanceof Listing) {
            return response()->json([
                'message' => __('Listing is not available for buyer notifications.'),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $eventId = $validated['event_id'] ?? 'listing-offered:'.$listing->getKey();
        $notified = 0;

        $this->buyerRecipients()
            ->each(function (User $user) use ($eventId, $listing, &$notified): void {
                if ($this->alreadyNotified($user, $eventId)) {
                    return;
                }

                $user->notify(new ListingOfferedNotification($listing, $eventId));
                $notified++;
            });

        return response()->json([
            'message' => __('Listing offer notifications delivered.'),
            'notified' => $notified,
        ]);
    }

    public function offeredV2(Request $request, AcceptListingAnnouncement $accept): JsonResponse
    {
        app(ListingWebhookSignature::class)->validate($request);
        $validated = $request->validate([
            'listing_id' => ['required', 'uuid'],
            'event_id' => ['required', 'string', 'max:120'],
        ]);
        $id = $accept->handle($validated['event_id'], $validated['listing_id']);

        return response()->json(['message' => __('Listing announcement accepted.'), 'receipt_id' => $id], 202);
    }

    /**
     * @return Collection<int, User>
     */
    private function buyerRecipients(): Collection
    {
        return User::query()
            ->whereNotNull('email_verified_at')
            ->whereHas('contact', fn ($query) => $query->where('role', ContactRole::Buyer))
            ->whereDoesntHave('roles', fn ($query) => $query->whereIn('key', ['admin', 'agent']))
            ->get();
    }

    private function alreadyNotified(User $user, string $eventId): bool
    {
        return $user->notifications()
            ->where('type', ListingOfferedNotification::class)
            ->get()
            ->contains(fn ($notification): bool => ($notification->data['event_id'] ?? null) === $eventId);
    }
}
