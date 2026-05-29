<?php

namespace App\Http\Controllers;

use App\Models\Viewing;
use App\Http\Requests\Viewings\StoreViewingRequest;
use App\Http\Requests\Viewings\UpdateViewingRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
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
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', Viewing::class);

        return Inertia::render('viewings/create');
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

    public function edit(Viewing $viewing): Response
    {
        Gate::authorize('update', $viewing);

        return Inertia::render('viewings/edit', ['viewing' => $viewing]);
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
}
