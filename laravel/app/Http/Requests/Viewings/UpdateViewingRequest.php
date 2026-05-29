<?php

namespace App\Http\Requests\Viewings;

use App\Enums\ListingStatus;
use App\Enums\ViewingStatus;
use App\Models\Listing;
use App\Services\OwnershipScope;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateViewingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('viewing')) ?? false;
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
            'status' => ['required', Rule::enum(ViewingStatus::class)],
            'scheduled_at' => ['required', 'date'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $listing = Listing::query()->find($this->input('listing_id'));

            if ($listing && ! app(OwnershipScope::class)->canAccess($this->user(), $listing, 'viewing.update')) {
                $validator->errors()->add('listing_id', 'You may only move viewings to assigned listings.');
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
