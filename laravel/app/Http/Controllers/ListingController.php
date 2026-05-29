<?php

namespace App\Http\Controllers;

use App\Http\Requests\Listings\StoreListingRequest;
use App\Http\Requests\Listings\UpdateListingRequest;
use App\Models\Listing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ListingController extends Controller
{
    public function index(Request $request): JsonResponse|Response
    {
        Gate::authorize('viewAny', Listing::class);

        $listings = Listing::query()
            ->with(['assignedAgent:id,name,email', 'owner:id,first_name,last_name,email,phone'])
            ->when(! $request->user()->hasRole('admin'), fn ($query) => $query->where('assigned_agent_id', $request->user()->id))
            ->when($request->filled('search'), function ($query) use ($request): void {
                $search = $request->string('search')->toString();

                $query->where(function ($query) use ($search): void {
                    $query->where('address', 'like', "%{$search}%")
                        ->orWhere('property_type', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        if ($request->expectsJson()) {
            return response()->json(['listings' => $listings]);
        }

        return Inertia::render('listings/index', [
            'listings' => $listings,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', Listing::class);

        return Inertia::render('listings/create');
    }

    public function store(StoreListingRequest $request): JsonResponse|RedirectResponse
    {
        $listing = Listing::query()->create($request->validated());

        if ($request->expectsJson()) {
            return response()->json(['listing' => $listing], 201);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Listing created.')]);

        return to_route('listings.show', $listing);
    }

    public function show(Request $request, Listing $listing): JsonResponse|Response
    {
        Gate::authorize('view', $listing);

        $listing->load(['assignedAgent:id,name,email', 'owner:id,first_name,last_name,email,phone', 'media']);

        if ($request->expectsJson()) {
            return response()->json(['listing' => $listing]);
        }

        return Inertia::render('listings/show', [
            'listing' => $listing,
        ]);
    }

    public function edit(Listing $listing): Response
    {
        Gate::authorize('update', $listing);

        return Inertia::render('listings/edit', [
            'listing' => $listing,
        ]);
    }

    public function update(UpdateListingRequest $request, Listing $listing): JsonResponse|RedirectResponse
    {
        $listing->update($request->validated());

        if ($request->expectsJson()) {
            return response()->json(['listing' => $listing->refresh()]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Listing updated.')]);

        return to_route('listings.show', $listing);
    }

    public function destroy(Request $request, Listing $listing): JsonResponse|RedirectResponse
    {
        Gate::authorize('delete', $listing);

        $listing->delete();

        if ($request->expectsJson()) {
            return response()->json(status: 204);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Listing deleted.')]);

        return to_route('listings.index');
    }
}
