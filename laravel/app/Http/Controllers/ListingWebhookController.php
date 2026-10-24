<?php

namespace App\Http\Controllers;

use App\Enums\ContactRole;
use App\Models\Listing;
use App\Models\User;
use App\Notifications\ListingOfferedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\Response;

class ListingWebhookController extends Controller
{
    public function offered(Request $request): JsonResponse
    {
        $this->validateSignature($request);

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
            'message' => __('Listing offer notifications queued.'),
            'notified' => $notified,
        ]);
    }

    private function validateSignature(Request $request): void
    {
        $secret = config('services.listing_webhook.secret');

        abort_if(! is_string($secret) || $secret === '', Response::HTTP_SERVICE_UNAVAILABLE);

        $timestamp = $request->header('X-Webhook-Timestamp');
        $signature = $request->header('X-Webhook-Signature');

        abort_if(! is_string($timestamp) || ! ctype_digit($timestamp), Response::HTTP_UNAUTHORIZED);
        abort_if(! is_string($signature) || $signature === '', Response::HTTP_UNAUTHORIZED);

        $tolerance = (int) config('services.listing_webhook.signature_tolerance', 300);

        abort_if(abs(now()->timestamp - (int) $timestamp) > $tolerance, Response::HTTP_UNAUTHORIZED);

        $expected = hash_hmac('sha256', $timestamp.'.'.$request->getContent(), $secret);
        $normalizedSignature = str_starts_with($signature, 'sha256=')
            ? substr($signature, 7)
            : $signature;

        abort_unless(hash_equals($expected, $normalizedSignature), Response::HTTP_UNAUTHORIZED);
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
