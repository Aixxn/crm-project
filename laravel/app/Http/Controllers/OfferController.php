<?php

namespace App\Http\Controllers;

use App\Actions\Lifecycle\ChangeRecord;
use App\Http\Requests\Offers\StoreOfferRequest;
use App\Http\Requests\Offers\UpdateOfferRequest;
use App\Models\Contact;
use App\Models\Listing;
use App\Models\Offer;
use App\Services\OwnershipScope;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class OfferController extends Controller
{
    public function __construct(private OwnershipScope $ownershipScope) {}

    public function index(Request $request): JsonResponse|Response
    {
        Gate::authorize('viewAny', Offer::class);

        $offers = $this->ownershipScope->scope($request->user(), Offer::query(), 'offer.read')
            ->with(['listing' => $this->ownershipScope->readRelation($request->user()), 'contact' => $this->ownershipScope->readRelation($request->user())])

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
            'listings' => $this->listingOptions($request),
        ]);
    }

    public function create(Request $request): Response
    {
        Gate::authorize('create', Offer::class);

        return Inertia::render('offers/create', [
            'listings' => $this->listingOptions($request),
            'contacts' => $this->contactOptions($request),
        ]);
    }

    public function store(StoreOfferRequest $request): JsonResponse|RedirectResponse
    {
        $offer = app(ChangeRecord::class)->create($request->user(), new Offer, $request->validated());

        if ($request->expectsJson()) {
            return response()->json(['offer' => $offer], 201);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Offer created.')]);

        return to_route('offers.show', $offer);
    }

    public function show(Request $request, Offer $offer): JsonResponse|Response
    {
        Gate::authorize('view', $offer);

        $offer->load(['listing' => $this->ownershipScope->readRelation($request->user()), 'contact' => $this->ownershipScope->readRelation($request->user())]);

        if ($request->expectsJson()) {
            return response()->json(['offer' => $offer]);
        }

        return Inertia::render('offers/show', ['offer' => $offer]);
    }

    public function edit(Request $request, Offer $offer): Response
    {
        Gate::authorize('update', $offer);

        return Inertia::render('offers/edit', [
            'offer' => $offer,
            'listings' => $this->listingOptions($request),
            'contacts' => $this->contactOptions($request),
        ]);
    }

    public function update(UpdateOfferRequest $request, Offer $offer): JsonResponse|RedirectResponse
    {
        $offer = app(ChangeRecord::class)->update($request->user(), $offer, $request->validated());

        if ($request->expectsJson()) {
            return response()->json(['offer' => $offer->refresh()]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Offer updated.')]);

        return to_route('offers.show', $offer);
    }

    public function destroy(Request $request, Offer $offer): JsonResponse|RedirectResponse
    {
        Gate::authorize('delete', $offer);

        app(ChangeRecord::class)->deleteOffer($request->user(), $offer);

        if ($request->expectsJson()) {
            return response()->json(status: 204);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Offer deleted.')]);

        return to_route('offers.index');
    }

    /**
     * @return Collection<int, Listing>
     */
    private function listingOptions(Request $request): Collection
    {
        return $this->ownershipScope->scope($request->user(), Listing::query(), 'listing.read')
            ->select(['id', 'address', 'assigned_agent_id'])

            ->orderBy('address')
            ->get();
    }

    /**
     * @return Collection<int, Contact>
     */
    private function contactOptions(Request $request): Collection
    {
        return $this->ownershipScope->scope($request->user(), Contact::query(), 'contact.read')
            ->select(['id', 'first_name', 'last_name', 'email', 'phone'])

            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();
    }
}
