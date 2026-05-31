<?php

namespace App\Http\Controllers;

use App\Http\Requests\Inquiries\StoreInquiryRequest;
use App\Http\Requests\Inquiries\UpdateInquiryRequest;
use App\Models\Contact;
use App\Models\Inquiry;
use App\Models\Listing;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class InquiryController extends Controller
{
    public function index(Request $request): JsonResponse|Response
    {
        Gate::authorize('viewAny', Inquiry::class);

        $inquiries = Inquiry::query()
            ->with(['listing:id,address,assigned_agent_id', 'contact:id,first_name,last_name,email,phone'])
            ->when(! $request->user()->hasRole('admin'), fn ($query) => $query->whereHas('listing', fn ($query) => $query->where('assigned_agent_id', $request->user()->id)))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->when($request->filled('listing_id'), fn ($query) => $query->where('listing_id', $request->string('listing_id')->toString()))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        if ($request->expectsJson()) {
            return response()->json(['inquiries' => $inquiries]);
        }

        return Inertia::render('inquiries/index', [
            'inquiries' => $inquiries,
            'filters' => $request->only(['status', 'listing_id']),
            'listings' => $this->listingOptions($request),
        ]);
    }

    public function create(Request $request): Response
    {
        Gate::authorize('create', Inquiry::class);

        return Inertia::render('inquiries/create', [
            'listings' => $this->listingOptions($request),
            'contacts' => $this->contactOptions($request),
        ]);
    }

    public function store(StoreInquiryRequest $request): JsonResponse|RedirectResponse
    {
        $inquiry = Inquiry::query()->create($request->validated());

        if ($request->expectsJson()) {
            return response()->json(['inquiry' => $inquiry], 201);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Inquiry created.')]);

        return to_route('inquiries.show', $inquiry);
    }

    public function show(Request $request, Inquiry $inquiry): JsonResponse|Response
    {
        Gate::authorize('view', $inquiry);

        $inquiry->load(['listing', 'contact']);

        if ($request->expectsJson()) {
            return response()->json(['inquiry' => $inquiry]);
        }

        return Inertia::render('inquiries/show', ['inquiry' => $inquiry]);
    }

    public function edit(Request $request, Inquiry $inquiry): Response
    {
        Gate::authorize('update', $inquiry);

        return Inertia::render('inquiries/edit', [
            'inquiry' => $inquiry,
            'listings' => $this->listingOptions($request),
            'contacts' => $this->contactOptions($request),
        ]);
    }

    public function update(UpdateInquiryRequest $request, Inquiry $inquiry): JsonResponse|RedirectResponse
    {
        $inquiry->update($request->validated());

        if ($request->expectsJson()) {
            return response()->json(['inquiry' => $inquiry->refresh()]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Inquiry updated.')]);

        return to_route('inquiries.show', $inquiry);
    }

    public function destroy(Request $request, Inquiry $inquiry): JsonResponse|RedirectResponse
    {
        Gate::authorize('delete', $inquiry);

        $inquiry->delete();

        if ($request->expectsJson()) {
            return response()->json(status: 204);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Inquiry deleted.')]);

        return to_route('inquiries.index');
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
}
