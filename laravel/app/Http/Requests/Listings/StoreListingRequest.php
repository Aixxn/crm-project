<?php

namespace App\Http\Requests\Listings;

use App\Models\Listing;
use App\Rules\AccessibleContact;
use App\Rules\EligibleListingAgent;
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
        return (! $this->filled('new_owner') || $this->user()?->hasPermission('contact.create'))
            && $this->user()?->can('create', Listing::class) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'assigned_agent_id' => ['required', 'integer', new EligibleListingAgent],
            'owner_contact_id' => ['required_without:new_owner', 'nullable', 'uuid', 'prohibits:new_owner', new AccessibleContact($this->user())],
            'new_owner' => ['required_without:owner_contact_id', 'nullable', 'array:first_name,last_name,email,phone'],
            'new_owner.first_name' => ['required_with:new_owner', 'string', 'max:255'],
            'new_owner.last_name' => ['nullable', 'string', 'max:255'],
            'new_owner.email' => ['nullable', 'email', 'max:255'],
            'new_owner.phone' => ['nullable', 'string', 'max:255'],
            'status' => ['required', Rule::in(['Draft'])],
            'address' => ['required', 'string', 'max:255'],
            'property_type' => ['nullable', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'bedrooms' => ['nullable', 'integer', 'min:0', 'max:255'],
            'bathrooms' => ['nullable', 'numeric', 'min:0', 'max:99.9'],
            'area_sqft' => ['nullable', 'integer', 'min:0'],
            'images' => ['nullable', 'array', 'max:3'],
            'images.*' => ['file', 'mimes:jpg,jpeg,png', 'max:5120'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            if (! $this->user()?->can('assignAgent', [Listing::class, (int) $this->input('assigned_agent_id')])) {
                $validator->errors()->add('assigned_agent_id', 'You may only assign listings to yourself.');
            }
        });
    }
}
