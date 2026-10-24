<?php

namespace App\Actions\Viewings;

use App\Actions\Lifecycle\RecordTransition;
use App\Enums\InquiryStatus;
use App\Enums\ViewingStatus;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\User;
use App\Models\Viewing;
use App\Rules\OffsetDateTime;
use App\Services\BuyerPortalScope;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class RequestPublicViewing
{
    public function __construct(private BuyerPortalScope $portal, private RecordTransition $history) {}

    public function handle(User $actor, Listing $listing, string $scheduledAt, ?string $intent = null): Viewing
    {
        Validator::make(['scheduled_at' => $scheduledAt, 'intent' => $intent], ['scheduled_at' => ['required', 'date', new OffsetDateTime], 'intent' => ['nullable', 'in:buy,rent']])->validate();
        try {
            return DB::transaction(function () use ($actor, $listing, $scheduledAt, $intent): Viewing {
                $listing = Listing::query()->published()->lockForUpdate()->findOrFail($listing->id);
                $actor = User::query()->lockForUpdate()->findOrFail($actor->id);
                abort_unless($actor->hasVerifiedEmail(), 403);
                $contact = $this->portal->contact($actor);
                $time = Carbon::parse($scheduledAt)->utc();
                if (! $time->isFuture()) {
                    throw ValidationException::withMessages(['scheduled_at' => 'Choose a future viewing time.']);
                }
                if (Viewing::query()->where('listing_id', $listing->id)->where('contact_id', $contact->id)->where('scheduled_at', $time)->whereIn('status', [ViewingStatus::Requested, ViewingStatus::Scheduled])->exists()) {
                    throw ValidationException::withMessages(['scheduled_at' => 'You already requested this viewing time.']);
                }
                $inquiry = Inquiry::query()->where('listing_id', $listing->id)->where('contact_id', $contact->id)
                    ->whereIn('status', [InquiryStatus::New, InquiryStatus::Contacted, InquiryStatus::Qualified])
                    ->when($intent, fn ($query) => $query->where('intent', $intent))->latest()->lockForUpdate()->first();
                $message = 'Viewing requested for '.$time->format('M j, Y g:i A').' UTC.';
                if ($inquiry) {
                    $inquiry->update(['message' => trim(implode("\n\n", array_filter([$inquiry->message, $message])))]);
                } else {
                    $inquiry = Inquiry::query()->create([
                        'listing_id' => $listing->id, 'contact_id' => $contact->id, 'status' => InquiryStatus::New,
                        'source' => 'Public Portal', 'intent' => $intent ?? 'buy', 'message' => $message,
                    ]);
                    $this->history->handle($actor, $inquiry, null, operation: 'create');
                }
                $viewing = Viewing::query()->create([
                    'listing_id' => $listing->id, 'contact_id' => $contact->id, 'agent_id' => $listing->assigned_agent_id,
                    'status' => ViewingStatus::Requested, 'scheduled_at' => $time,
                ]);
                $this->history->handle($actor, $viewing, null, operation: 'create');

                return $viewing;
            }, 3);
        } catch (UniqueConstraintViolationException $exception) {
            if (str_contains($exception->getMessage(), 'viewings')) {
                throw ValidationException::withMessages(['scheduled_at' => 'You already requested this viewing time.']);
            }
            throw $exception;
        }
    }
}
