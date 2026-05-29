<?php

namespace App\Http\Requests\Inquiries;

use App\Enums\InquiryStatus;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Services\OwnershipScope;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInquiryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Inquiry::class) ?? false;
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
            'status' => ['required', Rule::enum(InquiryStatus::class)],
            'source' => ['required', 'string', 'max:255'],
            'intent' => ['required', 'string', 'max:255'],
            'budget' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $listing = Listing::query()->find($this->input('listing_id'));

            if ($listing && ! app(OwnershipScope::class)->canAccess($this->user(), $listing, 'inquiry.create')) {
                $validator->errors()->add('listing_id', 'You may only create inquiries for assigned listings.');
            }
        });
    }
}
