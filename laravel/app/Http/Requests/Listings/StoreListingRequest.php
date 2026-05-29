<?php

namespace App\Http\Requests\Listings;

use App\Enums\ListingStatus;
use App\Models\Listing;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreListingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('create', Listing::class) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'assigned_agent_id' => ['required', 'integer', 'exists:users,id'],
            'owner_contact_id' => ['required', 'uuid', 'exists:contacts,id'],
            'status' => ['required', Rule::enum(ListingStatus::class)],
            'address' => ['required', 'string', 'max:255'],
            'property_type' => ['nullable', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'bedrooms' => ['nullable', 'integer', 'min:0', 'max:255'],
            'bathrooms' => ['nullable', 'numeric', 'min:0', 'max:99.9'],
            'area_sqft' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if (! $this->user()?->can('assignAgent', [Listing::class, (int) $this->input('assigned_agent_id')])) {
                $validator->errors()->add('assigned_agent_id', 'You may only assign listings to yourself.');
            }
        });
    }
}
