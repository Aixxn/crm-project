<?php

namespace App\Http\Requests\Inquiries;

use App\Models\Inquiry;
use App\Models\Listing;
use App\Rules\AccessibleContact;
use App\Services\OwnershipScope;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInquiryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (! $this->filled('new_contact') || $this->user()?->hasPermission('contact.create'))
            && $this->user()?->can('create', Inquiry::class) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'listing_id' => ['required', 'uuid', Rule::exists('listings', 'id')->whereNull('deleted_at')],
            'contact_id' => ['required_without:new_contact', 'nullable', 'uuid', 'prohibits:new_contact', new AccessibleContact($this->user())],
            'new_contact' => ['required_without:contact_id', 'nullable', 'array:first_name,last_name,email,phone'],
            'new_contact.first_name' => ['required_with:new_contact', 'string', 'max:255'],
            'new_contact.last_name' => ['nullable', 'string', 'max:255'],
            'new_contact.email' => ['nullable', 'email', 'max:255'],
            'new_contact.phone' => ['nullable', 'string', 'max:255'],
            'status' => ['required', Rule::in(['New'])],
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

            if ($listing && ! app(OwnershipScope::class)->canAccess($this->user(), $listing, 'inquiry.create')) {
                $validator->errors()->add('listing_id', 'You may only create inquiries for assigned listings.');
            }
        });
    }
}
