<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class PortalNotificationController extends Controller
{
    public function update(Request $request, DatabaseNotification $notification): RedirectResponse
    {
        abort_unless(
            $notification->notifiable_type === $request->user()->getMorphClass()
            && (string) $notification->notifiable_id === (string) $request->user()->getKey(),
            404,
        );

        $notification->markAsRead();

        return back();
    }
}
