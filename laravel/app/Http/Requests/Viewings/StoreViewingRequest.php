<?php

namespace App\Http\Requests\Viewings;

use App\Enums\ListingStatus;
use App\Models\Contact;
use App\Models\Listing;
use App\Models\User;
use App\Models\Viewing;
use App\Rules\OffsetDateTime;
use App\Services\OwnershipScope;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreViewingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Viewing::class) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'listing_id' => ['required', 'uuid', 'exists:listings,id'],
            'contact_id' => ['required', 'uuid', 'exists:contacts,id'],
            'agent_id' => ['required', 'integer', 'exists:users,id'],
            'status' => ['required', Rule::in(['Requested', 'Scheduled'])],
            'scheduled_at' => ['required', 'date', new OffsetDateTime],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $listing = Listing::query()->find($this->input('listing_id'));
            $agent = User::query()->find($this->input('agent_id'));
            if (! $agent || ! $agent->hasCrmAccess()) {
                $validator->errors()->add('agent_id', 'The selected agent is not eligible CRM staff.');
            }
            $contact = Contact::query()->find($this->input('contact_id'));
            if (! $contact || ! app(OwnershipScope::class)->canAccess($this->user(), $contact, 'contact.read')) {
                $validator->errors()->add('contact_id', 'The selected contact is not accessible.');
            }

            if (! $listing || ! app(OwnershipScope::class)->canAccess($this->user(), $listing, 'viewing.create')) {
                $validator->errors()->add('listing_id', 'You may only create viewings for assigned listings.');
            }

            if ($listing && in_array($listing->status, [ListingStatus::Closed, ListingStatus::ClosedLost], true)) {
                $validator->errors()->add('listing_id', 'You may not schedule a viewing on a closed listing.');
            }

            if (! $this->user()?->hasRole('admin') && (int) $this->input('agent_id') !== (int) $this->user()?->getKey()) {
                $validator->errors()->add('agent_id', 'You may only assign viewings to yourself.');
            }
        });
    }
}
