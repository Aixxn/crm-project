<?php

namespace App\Notifications;

use App\Models\Listing;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ListingOfferedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Listing $listing,
        public string $eventId,
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'event_id' => $this->eventId,
            'listing_id' => $this->listing->getKey(),
            'title' => $this->listing->address,
            'message' => __('New listing offered: :address', ['address' => $this->listing->address]),
            'status' => $this->listing->status->value,
            'price' => (float) $this->listing->price,
            'href' => route('public.property.show', $this->listing, false),
        ];
    }
}
