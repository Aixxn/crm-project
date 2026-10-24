<?php

namespace App\Http\Controllers;

use App\Actions\Lifecycle\ChangeRecord;
use App\Actions\Listings\CreateListing;
use App\Http\Requests\Listings\StoreListingRequest;
use App\Http\Requests\Listings\UpdateListingRequest;
use App\Models\Contact;
use App\Models\Listing;
use App\Models\ListingMedia;
use App\Models\User;
use App\Services\OwnershipScope;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ListingController extends Controller
{
    public function __construct(private OwnershipScope $ownershipScope) {}

    public function index(Request $request): JsonResponse|Response
    {
        Gate::authorize('viewAny', Listing::class);

        $listings = $this->ownershipScope->scope($request->user(), Listing::query(), 'listing.read')
            ->with([
                'assignedAgent:id,name,email',
                'owner' => $this->ownershipScope->readRelation($request->user()),
                'media' => fn ($query) => $query->orderBy('sort_order'),
            ])

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

    public function create(Request $request): Response
    {
        Gate::authorize('create', Listing::class);

        return Inertia::render('listings/create', [
            'canCreateContact' => $request->user()->hasPermission('contact.create') && $request->user()->hasPermission('listing.create'),
            'agents' => $this->agentOptions($request),
            'owners' => $this->ownerOptions($request),
        ]);
    }

    public function store(StoreListingRequest $request, CreateListing $createListing): JsonResponse|RedirectResponse
    {
        $validated = $request->validated();
        $images = $validated['images'] ?? [];
        unset($validated['images']);

        $listing = $createListing->handle($request->user(), $validated);

        foreach ($images as $index => $image) {
            $path = $image->store("listings/{$listing->getKey()}", 'public');

            ListingMedia::query()->create([
                'listing_id' => $listing->getKey(),
                'url' => Storage::disk('public')->url($path),
                'type' => 'photo',
                'sort_order' => $index,
            ]);
        }

        if ($request->expectsJson()) {
            return response()->json(['listing' => $listing->load('media')], 201);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Listing created.')]);

        return to_route('listings.show', $listing);
    }

    public function show(Request $request, Listing $listing): JsonResponse|Response
    {
        Gate::authorize('view', $listing);

        $this->ownershipScope->loadListingActivity($request->user(), $listing);

        if ($request->expectsJson()) {
            return response()->json(['listing' => $listing]);
        }

        return Inertia::render('listings/show', [
            'listing' => $listing,
        ]);
    }

    public function edit(Request $request, Listing $listing): Response
    {
        Gate::authorize('update', $listing);

        return Inertia::render('listings/edit', [
            'listing' => $listing,
            'agents' => $this->agentOptions($request),
            'owners' => $this->ownerOptions($request),
        ]);
    }

    public function update(UpdateListingRequest $request, Listing $listing): JsonResponse|RedirectResponse
    {
        $listing = app(ChangeRecord::class)->update($request->user(), $listing, $request->validated());

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

    /**
     * @return Collection<int, User>
     */
    private function agentOptions(Request $request): Collection
    {
        return User::query()
            ->select(['id', 'name', 'email'])
            ->when(! $request->user()->hasRole('admin'), fn ($query) => $query->whereKey($request->user()->id))
            ->orderBy('name')
            ->get()
            ->filter(fn (User $user) => $user->hasCrmAccess())
            ->values();
    }

    /**
     * @return Collection<int, Contact>
     */
    private function ownerOptions(Request $request): Collection
    {
        return $this->ownershipScope->scope($request->user(), Contact::query(), 'contact.read')
            ->select(['id', 'first_name', 'last_name', 'email', 'phone'])
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();
    }
}
