<?php

namespace App\Http\Controllers;

use App\Services\BuyerPortalScope;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicSettingsController extends Controller
{
    public function __construct(private BuyerPortalScope $buyerPortalScope) {}

    public function edit(Request $request): Response
    {
        $contact = $this->buyerPortalScope->ensureContact($request->user());

        return Inertia::render('public/settings', [
            'profile' => [
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'firstName' => $contact->first_name,
                'lastName' => $contact->last_name,
                'phone' => $contact->phone,
            ],
            'recentSearches' => $request->user()
                ->portalSearches()
                ->latest('last_used_at')
                ->take(12)
                ->get()
                ->map(fn ($search) => [
                    'id' => $search->getKey(),
                    'name' => $search->name,
                    'filters' => $search->filters,
                ])
                ->values(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
        ]);

        $contact = $this->buyerPortalScope->ensureContact($request->user());

        $contact->update([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'] ?? null,
            'phone' => $validated['phone'] ?? null,
        ]);

        $request->user()->update([
            'name' => trim($validated['first_name'].' '.($validated['last_name'] ?? '')),
        ]);

        return back()->with('success', 'Settings updated.');
    }
}
