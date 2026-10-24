<?php

namespace App\Http\Controllers;

use App\Actions\Inquiries\CreateInquiry;
use App\Actions\Lifecycle\ChangeRecord;
use App\Http\Requests\Inquiries\StoreInquiryRequest;
use App\Http\Requests\Inquiries\UpdateInquiryRequest;
use App\Models\Contact;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Services\OwnershipScope;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class InquiryController extends Controller
{
    public function __construct(private OwnershipScope $ownershipScope) {}

    public function index(Request $request): JsonResponse|Response
    {
        Gate::authorize('viewAny', Inquiry::class);

        $inquiries = $this->ownershipScope->scope($request->user(), Inquiry::query(), 'inquiry.read')
            ->with(['listing' => $this->ownershipScope->readRelation($request->user()), 'contact' => $this->ownershipScope->readRelation($request->user())])

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
            'canCreateContact' => $request->user()->hasPermission('contact.create') && $request->user()->hasPermission('inquiry.create'),
            'listings' => $this->listingOptions($request),
            'contacts' => $this->contactOptions($request),
        ]);
    }

    public function store(StoreInquiryRequest $request, CreateInquiry $createInquiry): JsonResponse|RedirectResponse
    {
        $inquiry = $createInquiry->handle($request->user(), $request->validated());

        if ($request->expectsJson()) {
            return response()->json(['inquiry' => $inquiry], 201);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Inquiry created.')]);

        return to_route('inquiries.show', $inquiry);
    }

    public function show(Request $request, Inquiry $inquiry): JsonResponse|Response
    {
        Gate::authorize('view', $inquiry);

        $inquiry->load(['listing' => $this->ownershipScope->readRelation($request->user()), 'contact' => $this->ownershipScope->readRelation($request->user())]);

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
        $inquiry = app(ChangeRecord::class)->update($request->user(), $inquiry, $request->validated());

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
