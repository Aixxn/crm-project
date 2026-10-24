<?php

namespace App\Http\Controllers;

use App\Http\Requests\Notes\StoreNoteRequest;
use App\Http\Requests\Notes\UpdateNoteRequest;
use App\Models\Contact;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\Note;
use App\Models\Offer;
use App\Services\OwnershipScope;
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
    public function __construct(private OwnershipScope $ownershipScope) {}

    public function index(Request $request): JsonResponse|Response
    {
        Gate::authorize('viewAny', Note::class);

        $notes = $this->ownershipScope->scope($request->user(), Note::query(), 'note.read')
            ->with(['author:id,name,email', 'relatedEntity' => $this->ownershipScope->readRelation($request->user())])

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

        $note->load(['author:id,name,email', 'relatedEntity' => $this->ownershipScope->readRelation($request->user())]);

        if ($request->expectsJson()) {
            return response()->json(['note' => $note]);
        }

        return Inertia::render('notes/show', ['note' => $note]);
    }

    public function edit(Request $request, Note $note): Response
    {
        Gate::authorize('update', $note);

        return Inertia::render('notes/edit', [
            'note' => $note->load(['author:id,name,email', 'relatedEntity' => $this->ownershipScope->readRelation($request->user())]),
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

    /**
     * @return Collection<int, array{id: string, type: class-string, kind: string, label: string}>
     */
    private function relatedEntityOptions(Request $request): Collection
    {

        $listings = $this->ownershipScope->scope($request->user(), Listing::query(), 'listing.read')
            ->select(['id', 'address', 'assigned_agent_id'])

            ->orderBy('address')
            ->get()
            ->map(fn (Listing $listing) => [
                'id' => $listing->id,
                'type' => Listing::class,
                'kind' => 'Listing',
                'label' => $listing->address,
            ]);

        $inquiries = $this->ownershipScope->scope($request->user(), Inquiry::query(), 'inquiry.read')
            ->select(['id', 'listing_id', 'source', 'intent'])
            ->with(['listing' => $this->ownershipScope->readRelation($request->user())])

            ->latest()
            ->get()
            ->map(fn (Inquiry $inquiry) => [
                'id' => $inquiry->id,
                'type' => Inquiry::class,
                'kind' => 'Inquiry',
                'label' => trim("{$inquiry->listing?->address} {$inquiry->intent}"),
            ]);

        $contacts = $this->ownershipScope->scope($request->user(), Contact::query(), 'contact.read')
            ->select(['id', 'first_name', 'last_name', 'email'])

            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get()
            ->map(fn (Contact $contact) => [
                'id' => $contact->id,
                'type' => Contact::class,
                'kind' => 'Contact',
                'label' => trim("{$contact->first_name} {$contact->last_name}") ?: $contact->email,
            ]);

        $offers = $this->ownershipScope->scope($request->user(), Offer::query(), 'offer.read')
            ->select(['id', 'listing_id', 'amount'])
            ->with(['listing' => $this->ownershipScope->readRelation($request->user())])

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
}
