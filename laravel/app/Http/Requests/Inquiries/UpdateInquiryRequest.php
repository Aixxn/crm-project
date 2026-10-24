<?php

namespace App\Http\Requests\Inquiries;

use App\Enums\InquiryStatus;
use App\Models\Contact;
use App\Models\Listing;
use App\Services\OwnershipScope;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInquiryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('inquiry')) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'reason' => ['nullable', 'string', 'max:2000'],
            'operation' => ['sometimes', 'string', Rule::in(['transition', 'correct', 'reopen'])],
            'listing_id' => ['required', 'uuid', 'exists:listings,id'],
            'contact_id' => ['required', 'uuid', 'exists:contacts,id'],
            'status' => ['required', Rule::enum(InquiryStatus::class)],
            'source' => ['required', 'string', 'max:255'],
            'intent' => ['required', 'string', 'max:255'],
            'budget' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
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

            if (! $listing || ! app(OwnershipScope::class)->canAccess($this->user(), $listing, 'inquiry.update')) {
                $validator->errors()->add('listing_id', 'You may only move inquiries to assigned listings.');
            }
        });
    }
}
