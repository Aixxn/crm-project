<?php

namespace App\Http\Requests\Offers;

use App\Enums\OfferStatus;
use App\Models\Listing;
use App\Services\OwnershipScope;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOfferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('offer')) ?? false;
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
            'status' => ['required', Rule::enum(OfferStatus::class)],
            'amount' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'notes' => ['nullable', 'string'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $listing = Listing::query()->find($this->input('listing_id'));

            if ($listing && ! app(OwnershipScope::class)->canAccess($this->user(), $listing, 'offer.update')) {
                $validator->errors()->add('listing_id', 'You may only move offers to assigned listings.');
            }
        });
    }
}
