<?php

namespace App\Http\Controllers;

use App\Actions\Viewings\RequestPublicViewing;
use App\Models\Listing;
use App\Rules\OffsetDateTime;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PublicViewingRequestController extends Controller
{
    public function store(Request $request, Listing $listing, RequestPublicViewing $intake): RedirectResponse
    {
        abort_unless($listing->isPublished(), 404);
        $validated = $request->validate([
            'scheduled_at' => ['required', 'date', new OffsetDateTime, 'after:now'],
            'intent' => ['nullable', 'in:buy,rent'],
        ]);
        $intake->handle($request->user(), $listing, $validated['scheduled_at'], $validated['intent'] ?? null);
        Inertia::flash('toast', ['type' => 'success', 'message' => __('Viewing request successful.')]);

        return back();
    }
}
