<?php

namespace App\Http\Controllers;

use App\Actions\Inquiries\CreatePublicInquiry;
use App\Models\Listing;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PublicInquiryController extends Controller
{
    public function store(Request $request, Listing $listing, CreatePublicInquiry $intake): RedirectResponse
    {
        abort_unless($listing->isPublished(), 404);
        $validated = $request->validate([
            'intent' => ['required', 'string', 'in:buy,rent'],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'message' => ['nullable', 'string', 'max:2000'],
        ]);
        $intake->handle($request->user(), $listing, $validated);

        return back()->with('success', 'Inquiry sent to the listing agent.');
    }
}
