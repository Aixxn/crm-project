<?php

namespace App\Http\Controllers;

use App\Http\Requests\Offers\StoreOfferRequest;
use App\Http\Requests\Offers\UpdateOfferRequest;
use App\Models\Offer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class OfferController extends Controller
{
    public function index(Request $request): JsonResponse|Response
    {
        Gate::authorize('viewAny', Offer::class);

        $offers = Offer::query()
            ->with(['listing:id,address,assigned_agent_id', 'contact:id,first_name,last_name,email,phone'])
            ->when(! $request->user()->hasRole('admin'), fn ($query) => $query->whereHas('listing', fn ($query) => $query->where('assigned_agent_id', $request->user()->id)))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->when($request->filled('listing_id'), fn ($query) => $query->where('listing_id', $request->string('listing_id')->toString()))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        if ($request->expectsJson()) {
            return response()->json(['offers' => $offers]);
        }

        return Inertia::render('offers/index', [
            'offers' => $offers,
            'filters' => $request->only(['status', 'listing_id']),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', Offer::class);

        return Inertia::render('offers/create');
    }

    public function store(StoreOfferRequest $request): JsonResponse|RedirectResponse
    {
        $offer = Offer::query()->create($request->validated());

        if ($request->expectsJson()) {
            return response()->json(['offer' => $offer], 201);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Offer created.')]);

        return to_route('offers.show', $offer);
    }

    public function show(Request $request, Offer $offer): JsonResponse|Response
    {
        Gate::authorize('view', $offer);

        $offer->load(['listing', 'contact']);

        if ($request->expectsJson()) {
            return response()->json(['offer' => $offer]);
        }

        return Inertia::render('offers/show', ['offer' => $offer]);
    }

    public function edit(Offer $offer): Response
    {
        Gate::authorize('update', $offer);

        return Inertia::render('offers/edit', ['offer' => $offer]);
    }

    public function update(UpdateOfferRequest $request, Offer $offer): JsonResponse|RedirectResponse
    {
        $offer->update($request->validated());

        if ($request->expectsJson()) {
            return response()->json(['offer' => $offer->refresh()]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Offer updated.')]);

        return to_route('offers.show', $offer);
    }

    public function destroy(Request $request, Offer $offer): JsonResponse|RedirectResponse
    {
        Gate::authorize('delete', $offer);

        $offer->delete();

        if ($request->expectsJson()) {
            return response()->json(status: 204);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Offer deleted.')]);

        return to_route('offers.index');
    }
}
