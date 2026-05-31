<?php

namespace App\Http\Controllers;

use App\Http\Requests\Viewings\StoreViewingRequest;
use App\Http\Requests\Viewings\UpdateViewingRequest;
use App\Models\Contact;
use App\Models\Listing;
use App\Models\User;
use App\Models\Viewing;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ViewingController extends Controller
{
    public function index(Request $request): JsonResponse|Response
    {
        Gate::authorize('viewAny', Viewing::class);

        $viewings = Viewing::query()
            ->with(['listing:id,address,assigned_agent_id', 'contact:id,first_name,last_name,email,phone', 'agent:id,name,email'])
            ->when(! $request->user()->hasRole('admin'), fn ($query) => $query->whereHas('listing', fn ($query) => $query->where('assigned_agent_id', $request->user()->id)))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->when($request->filled('listing_id'), fn ($query) => $query->where('listing_id', $request->string('listing_id')->toString()))
            ->orderBy('scheduled_at')
            ->paginate(15)
            ->withQueryString();

        if ($request->expectsJson()) {
            return response()->json(['viewings' => $viewings]);
        }

        return Inertia::render('viewings/index', [
            'viewings' => $viewings,
            'filters' => $request->only(['status', 'listing_id']),
            'listings' => $this->listingOptions($request),
        ]);
    }

    public function create(Request $request): Response
    {
        Gate::authorize('create', Viewing::class);

        return Inertia::render('viewings/create', [
            'listings' => $this->listingOptions($request),
            'contacts' => $this->contactOptions($request),
            'agents' => $this->agentOptions($request),
        ]);
    }

    public function store(StoreViewingRequest $request): JsonResponse|RedirectResponse
    {
        $viewing = Viewing::query()->create($request->validated());

        if ($request->expectsJson()) {
            return response()->json(['viewing' => $viewing], 201);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Viewing created.')]);

        return to_route('viewings.show', $viewing);
    }

    public function show(Request $request, Viewing $viewing): JsonResponse|Response
    {
        Gate::authorize('view', $viewing);

        $viewing->load(['listing', 'contact', 'agent:id,name,email']);

        if ($request->expectsJson()) {
            return response()->json(['viewing' => $viewing]);
        }

        return Inertia::render('viewings/show', ['viewing' => $viewing]);
    }

    public function edit(Request $request, Viewing $viewing): Response
    {
        Gate::authorize('update', $viewing);

        return Inertia::render('viewings/edit', [
            'viewing' => $viewing,
            'listings' => $this->listingOptions($request),
            'contacts' => $this->contactOptions($request),
            'agents' => $this->agentOptions($request),
        ]);
    }

    public function update(UpdateViewingRequest $request, Viewing $viewing): JsonResponse|RedirectResponse
    {
        $viewing->update($request->validated());

        if ($request->expectsJson()) {
            return response()->json(['viewing' => $viewing->refresh()]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Viewing updated.')]);

        return to_route('viewings.show', $viewing);
    }

    public function destroy(Request $request, Viewing $viewing): JsonResponse|RedirectResponse
    {
        Gate::authorize('delete', $viewing);

        $viewing->delete();

        if ($request->expectsJson()) {
            return response()->json(status: 204);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Viewing deleted.')]);

        return to_route('viewings.index');
    }

    /**
     * @return Collection<int, Listing>
     */
    private function listingOptions(Request $request): Collection
    {
        return Listing::query()
            ->select(['id', 'address', 'assigned_agent_id'])
            ->when(! $request->user()->hasRole('admin'), fn ($query) => $query->where('assigned_agent_id', $request->user()->id))
            ->orderBy('address')
            ->get();
    }

    /**
     * @return Collection<int, Contact>
     */
    private function contactOptions(Request $request): Collection
    {
        return Contact::query()
            ->select(['id', 'first_name', 'last_name', 'email', 'phone'])
            ->when(! $request->user()->hasRole('admin'), function ($query) use ($request): void {
                $query->where(function ($query) use ($request): void {
                    $query->whereHas('ownedListings', fn ($query) => $query->where('assigned_agent_id', $request->user()->id))
                        ->orWhereHas('inquiries.listing', fn ($query) => $query->where('assigned_agent_id', $request->user()->id))
                        ->orWhereHas('viewings.listing', fn ($query) => $query->where('assigned_agent_id', $request->user()->id))
                        ->orWhereHas('offers.listing', fn ($query) => $query->where('assigned_agent_id', $request->user()->id));
                });
            })
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();
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
}
