<?php

namespace App\Http\Controllers;

use App\Http\Requests\Contacts\StoreContactRequest;
use App\Http\Requests\Contacts\UpdateContactRequest;
use App\Models\Contact;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    public function index(Request $request): JsonResponse|Response
    {
        Gate::authorize('viewAny', Contact::class);

        $contacts = Contact::query()
            ->when(! $request->user()->hasRole('admin'), function ($query) use ($request): void {
                $query->where(function ($query) use ($request): void {
                    $query->whereHas('ownedListings', fn ($query) => $query->where('assigned_agent_id', $request->user()->id))
                        ->orWhereHas('inquiries.listing', fn ($query) => $query->where('assigned_agent_id', $request->user()->id))
                        ->orWhereHas('viewings.listing', fn ($query) => $query->where('assigned_agent_id', $request->user()->id))
                        ->orWhereHas('offers.listing', fn ($query) => $query->where('assigned_agent_id', $request->user()->id));
                });
            })
            ->when($request->filled('search'), function ($query) use ($request): void {
                $search = $request->string('search')->toString();

                $query->where(function ($query) use ($search): void {
                    $query->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('role'), fn ($query) => $query->where('role', $request->string('role')->toString()))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        if ($request->expectsJson()) {
            return response()->json(['contacts' => $contacts]);
        }

        return Inertia::render('contacts/index', [
            'contacts' => $contacts,
            'filters' => $request->only(['search', 'role']),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', Contact::class);

        return Inertia::render('contacts/create');
    }

    public function store(StoreContactRequest $request): JsonResponse|RedirectResponse
    {
        $contact = Contact::query()->create($request->validated());

        if ($request->expectsJson()) {
            return response()->json(['contact' => $contact], 201);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Contact created.')]);

        return to_route('contacts.index');
    }

    public function show(Request $request, Contact $contact): JsonResponse|Response
    {
        Gate::authorize('view', $contact);

        $contact->load(['ownedListings', 'inquiries.listing', 'viewings.listing', 'offers.listing']);

        if ($request->expectsJson()) {
            return response()->json(['contact' => $contact]);
        }

        return Inertia::render('contacts/show', [
            'contact' => $contact,
        ]);
    }

    public function edit(Contact $contact): Response
    {
        Gate::authorize('update', $contact);

        return Inertia::render('contacts/edit', [
            'contact' => $contact,
        ]);
    }

    public function update(UpdateContactRequest $request, Contact $contact): JsonResponse|RedirectResponse
    {
        $contact->update($request->validated());

        if ($request->expectsJson()) {
            return response()->json(['contact' => $contact->refresh()]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Contact updated.')]);

        return to_route('contacts.show', $contact);
    }

    public function destroy(Request $request, Contact $contact): JsonResponse|RedirectResponse
    {
        Gate::authorize('delete', $contact);

        $contact->delete();

        if ($request->expectsJson()) {
            return response()->json(status: 204);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Contact deleted.')]);

        return to_route('contacts.index');
    }
}
