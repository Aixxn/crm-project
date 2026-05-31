<?php

namespace App\Http\Controllers;

use App\Http\Requests\Notes\StoreNoteRequest;
use App\Http\Requests\Notes\UpdateNoteRequest;
use App\Models\Contact;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\Note;
use App\Models\Offer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class NoteController extends Controller
{
    public function index(Request $request): JsonResponse|Response
    {
        Gate::authorize('viewAny', Note::class);

        $notes = Note::query()
            ->with(['author:id,name,email', 'relatedEntity'])
            ->when(! $request->user()->hasRole('admin'), fn (Builder $query) => $this->scopeToAccessibleRelatedEntities($query, $request))
            ->when($request->filled('related_entity_type'), fn (Builder $query) => $query->where('related_entity_type', $request->string('related_entity_type')->toString()))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        if ($request->expectsJson()) {
            return response()->json(['notes' => $notes]);
        }

        return Inertia::render('notes/index', [
            'notes' => $notes,
            'filters' => $request->only(['related_entity_type']),
            'relatedEntities' => $this->relatedEntityOptions($request),
        ]);
    }

    public function create(Request $request): Response
    {
        Gate::authorize('create', Note::class);

        return Inertia::render('notes/create', [
            'relatedEntities' => $this->relatedEntityOptions($request),
        ]);
    }

    public function store(StoreNoteRequest $request): JsonResponse|RedirectResponse
    {
        $note = Note::query()->create([
            ...$request->validated(),
            'author_id' => $request->user()->id,
        ]);

        if ($request->expectsJson()) {
            return response()->json(['note' => $note], 201);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Note created.')]);

        return to_route('notes.show', $note);
    }

    public function show(Request $request, Note $note): JsonResponse|Response
    {
        Gate::authorize('view', $note);

        $note->load(['author:id,name,email', 'relatedEntity']);

        if ($request->expectsJson()) {
            return response()->json(['note' => $note]);
        }

        return Inertia::render('notes/show', ['note' => $note]);
    }

    public function edit(Request $request, Note $note): Response
    {
        Gate::authorize('update', $note);

        return Inertia::render('notes/edit', [
            'note' => $note->load(['author:id,name,email', 'relatedEntity']),
            'relatedEntities' => $this->relatedEntityOptions($request),
        ]);
    }

    public function update(UpdateNoteRequest $request, Note $note): JsonResponse|RedirectResponse
    {
        $note->update($request->validated());

        if ($request->expectsJson()) {
            return response()->json(['note' => $note->refresh()]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Note updated.')]);

        return to_route('notes.show', $note);
    }

    public function destroy(Request $request, Note $note): JsonResponse|RedirectResponse
    {
        Gate::authorize('delete', $note);

        $note->delete();

        if ($request->expectsJson()) {
            return response()->json(status: 204);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Note deleted.')]);

        return to_route('notes.index');
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
