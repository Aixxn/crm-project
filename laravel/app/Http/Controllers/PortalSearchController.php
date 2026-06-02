<?php

namespace App\Http\Controllers;

use App\Models\PortalSearch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PortalSearchController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'filters' => ['required', 'array'],
        ]);

        PortalSearch::create([
            'user_id' => $request->user()->getKey(),
            'name' => $validated['name'],
            'filters' => $validated['filters'],
            'last_used_at' => now(),
        ]);

        return back()->with('success', 'Search saved.');
    }

    public function destroy(Request $request, PortalSearch $portalSearch): RedirectResponse
    {
        abort_unless((int) $portalSearch->user_id === (int) $request->user()->getKey(), 403);

        $portalSearch->delete();

        return back()->with('success', 'Search removed.');
    }
}
