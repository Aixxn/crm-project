<?php

namespace App\Http\Controllers;

use App\Http\Requests\Listings\StoreListingRequest;
use App\Http\Requests\Listings\UpdateListingRequest;
use App\Models\Contact;
use App\Models\Listing;
use App\Models\ListingMedia;
use App\Models\User;
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
    public function index(Request $request): JsonResponse|Response
    {
        Gate::authorize('viewAny', Listing::class);

        $listings = Listing::query()
            ->with([
                'assignedAgent:id,name,email',
                'owner:id,first_name,last_name,email,phone',
                'media' => fn ($query) => $query->orderBy('sort_order'),
            ])
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

    public function create(Request $request): Response
    {
        Gate::authorize('create', Listing::class);

        return Inertia::render('listings/create', [
            'agents' => $this->agentOptions($request),
            'owners' => $this->ownerOptions(),
        ]);
    }

    public function store(StoreListingRequest $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validated();
        $images = $validated['images'] ?? [];
        unset($validated['images']);

        $listing = Listing::query()->create($validated);

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

        $listing->load([
            'assignedAgent:id,name,email',
            'owner:id,first_name,last_name,email,phone',
            'media',
            'inquiries.contact:id,first_name,last_name,email,phone',
            'viewings.contact:id,first_name,last_name,email,phone',
            'viewings.agent:id,name,email',
            'offers.contact:id,first_name,last_name,email,phone',
            'tasks.assignee:id,name,email',
            'notes.author:id,name,email',
        ]);

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
            'owners' => $this->ownerOptions(),
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

    /**
     * @return Collection<int, User>
     */
    private function agentOptions(Request $request): Collection
    {
        return User::query()
            ->select(['id', 'name', 'email'])
            ->when(! $request->user()->hasRole('admin'), fn ($query) => $query->whereKey($request->user()->id))
            ->orderBy('name')
            ->get();
    }

    /**
     * @return Collection<int, Contact>
     */
    private function ownerOptions(): Collection
    {
        return Contact::query()
            ->select(['id', 'first_name', 'last_name', 'email', 'phone'])
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();
    }
}
