<?php

namespace App\Http\Controllers;

use App\Http\Requests\Tasks\StoreTaskRequest;
use App\Http\Requests\Tasks\UpdateTaskRequest;
use App\Models\Contact;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\Offer;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    public function index(Request $request): JsonResponse|Response
    {
        Gate::authorize('viewAny', Task::class);

        $tasks = Task::query()
            ->with(['assignee:id,name,email', 'relatedEntity'])
            ->when(! $request->user()->hasRole('admin'), fn (Builder $query) => $this->scopeToAccessibleRelatedEntities($query, $request))
            ->when($request->filled('status'), fn (Builder $query) => $query->where('status', $request->string('status')->toString()))
            ->when($request->filled('assignee_id'), fn (Builder $query) => $query->where('assignee_id', $request->integer('assignee_id')))
            ->when($request->filled('related_entity_type'), fn (Builder $query) => $query->where('related_entity_type', $request->string('related_entity_type')->toString()))
            ->latest('due_date')
            ->latest()
            ->paginate(15)
            ->withQueryString();

        if ($request->expectsJson()) {
            return response()->json(['tasks' => $tasks]);
        }

        return Inertia::render('tasks/index', [
            'tasks' => $tasks,
            'filters' => $request->only(['status', 'assignee_id', 'related_entity_type']),
            'assignees' => $this->assigneeOptions($request),
            'relatedEntities' => $this->relatedEntityOptions($request),
        ]);
    }

    public function create(Request $request): Response
    {
        Gate::authorize('create', Task::class);

        return Inertia::render('tasks/create', [
            'assignees' => $this->assigneeOptions($request),
            'relatedEntities' => $this->relatedEntityOptions($request),
        ]);
    }

    public function store(StoreTaskRequest $request): JsonResponse|RedirectResponse
    {
        $task = Task::query()->create($request->validated());

        if ($request->expectsJson()) {
            return response()->json(['task' => $task], 201);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Task created.')]);

        return to_route('tasks.show', $task);
    }

    public function show(Request $request, Task $task): JsonResponse|Response
    {
        Gate::authorize('view', $task);

        $task->load(['assignee:id,name,email', 'relatedEntity']);

        if ($request->expectsJson()) {
            return response()->json(['task' => $task]);
        }

        return Inertia::render('tasks/show', ['task' => $task]);
    }

    public function edit(Request $request, Task $task): Response
    {
        Gate::authorize('update', $task);

        return Inertia::render('tasks/edit', [
            'task' => $task->load(['assignee:id,name,email', 'relatedEntity']),
            'assignees' => $this->assigneeOptions($request),
            'relatedEntities' => $this->relatedEntityOptions($request),
        ]);
    }

    public function update(UpdateTaskRequest $request, Task $task): JsonResponse|RedirectResponse
    {
        $task->update($request->validated());

        if ($request->expectsJson()) {
            return response()->json(['task' => $task->refresh()]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Task updated.')]);

        return to_route('tasks.show', $task);
    }

    public function destroy(Request $request, Task $task): JsonResponse|RedirectResponse
    {
        Gate::authorize('delete', $task);

        $task->delete();

        if ($request->expectsJson()) {
            return response()->json(status: 204);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Task deleted.')]);

        return to_route('tasks.index');
    }

    private function scopeToAccessibleRelatedEntities(Builder $query, Request $request): void
    {
        $userId = $request->user()->id;

        $query->where(function (Builder $query) use ($userId): void {
            $query->where(fn (Builder $query) => $query
                ->where('related_entity_type', Listing::class)
                ->whereIn('related_entity_id', Listing::query()->select('id')->where('assigned_agent_id', $userId)))
                ->orWhere(fn (Builder $query) => $query
                    ->where('related_entity_type', Inquiry::class)
                    ->whereIn('related_entity_id', Inquiry::query()->select('id')->whereHas('listing', fn (Builder $query) => $query->where('assigned_agent_id', $userId))))
                ->orWhere(fn (Builder $query) => $query
                    ->where('related_entity_type', Offer::class)
                    ->whereIn('related_entity_id', Offer::query()->select('id')->whereHas('listing', fn (Builder $query) => $query->where('assigned_agent_id', $userId))))
                ->orWhere(fn (Builder $query) => $query
                    ->where('related_entity_type', Contact::class)
                    ->whereIn('related_entity_id', $this->accessibleContactIds($userId)));
        });
    }

    /**
     * @return Collection<int, User>
     */
    private function assigneeOptions(Request $request): Collection
    {
        return User::query()
            ->select(['id', 'name', 'email'])
            ->when(! $request->user()->hasRole('admin'), fn (Builder $query) => $query->whereKey($request->user()->id))
            ->orderBy('name')
            ->get();
    }

    /**
     * @return Collection<int, array{id: string, type: class-string, kind: string, label: string}>
     */
    private function relatedEntityOptions(Request $request): Collection
    {
        $userId = $request->user()->id;
        $admin = $request->user()->hasRole('admin');

        $listings = Listing::query()
            ->select(['id', 'address', 'assigned_agent_id'])
            ->when(! $admin, fn (Builder $query) => $query->where('assigned_agent_id', $userId))
            ->orderBy('address')
            ->get()
            ->map(fn (Listing $listing) => [
                'id' => $listing->id,
                'type' => Listing::class,
                'kind' => 'Listing',
                'label' => $listing->address,
            ]);

        $inquiries = Inquiry::query()
            ->select(['id', 'listing_id', 'source', 'intent'])
            ->with('listing:id,address,assigned_agent_id')
            ->when(! $admin, fn (Builder $query) => $query->whereHas('listing', fn (Builder $query) => $query->where('assigned_agent_id', $userId)))
            ->latest()
            ->get()
            ->map(fn (Inquiry $inquiry) => [
                'id' => $inquiry->id,
                'type' => Inquiry::class,
                'kind' => 'Inquiry',
                'label' => trim("{$inquiry->listing?->address} {$inquiry->intent}"),
            ]);

        $contacts = Contact::query()
            ->select(['id', 'first_name', 'last_name', 'email'])
            ->when(! $admin, fn (Builder $query) => $query->whereIn('id', $this->accessibleContactIds($userId)))
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get()
            ->map(fn (Contact $contact) => [
                'id' => $contact->id,
                'type' => Contact::class,
                'kind' => 'Contact',
                'label' => trim("{$contact->first_name} {$contact->last_name}") ?: $contact->email,
            ]);

        $offers = Offer::query()
            ->select(['id', 'listing_id', 'amount'])
            ->with('listing:id,address,assigned_agent_id')
            ->when(! $admin, fn (Builder $query) => $query->whereHas('listing', fn (Builder $query) => $query->where('assigned_agent_id', $userId)))
            ->latest()
            ->get()
            ->map(fn (Offer $offer) => [
                'id' => $offer->id,
                'type' => Offer::class,
                'kind' => 'Offer',
                'label' => "{$offer->listing?->address} - {$offer->amount}",
            ]);

        return $listings->concat($inquiries)->concat($contacts)->concat($offers)->values();
    }

    private function accessibleContactIds(int $userId): Builder
    {
        return Contact::query()
            ->select('id')
            ->where(function (Builder $query) use ($userId): void {
                $query->whereHas('ownedListings', fn (Builder $query) => $query->where('assigned_agent_id', $userId))
                    ->orWhereHas('inquiries.listing', fn (Builder $query) => $query->where('assigned_agent_id', $userId))
                    ->orWhereHas('viewings.listing', fn (Builder $query) => $query->where('assigned_agent_id', $userId))
                    ->orWhereHas('offers.listing', fn (Builder $query) => $query->where('assigned_agent_id', $userId));
            });
    }
}
