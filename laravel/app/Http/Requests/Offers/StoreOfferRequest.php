<?php

namespace App\Http\Requests\Offers;

use App\Models\Contact;
use App\Models\Listing;
use App\Models\Offer;
use App\Services\OwnershipScope;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOfferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Offer::class) ?? false;
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
            'status' => ['required', Rule::in(['Submitted'])],
            'amount' => ['required', 'numeric', 'gt:0', 'decimal:0,2', 'max:9999999999.99'],
            'notes' => ['nullable', 'string'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $listing = Listing::query()->find($this->input('listing_id'));
            $contact = Contact::query()->find($this->input('contact_id'));
            if (! $contact || ! app(OwnershipScope::class)->canAccess($this->user(), $contact, 'contact.read')) {
                $validator->errors()->add('contact_id', 'The selected contact is not accessible.');
            }

            if (! $listing || ! app(OwnershipScope::class)->canAccess($this->user(), $listing, 'offer.create')) {
                $validator->errors()->add('listing_id', 'You may only create offers for assigned listings.');
            }
        });
    }
}
