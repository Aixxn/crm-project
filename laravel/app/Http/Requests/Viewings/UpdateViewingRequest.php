<?php

namespace App\Http\Requests\Viewings;

use App\Enums\ViewingStatus;
use App\Models\Contact;
use App\Models\Listing;
use App\Models\User;
use App\Rules\OffsetDateTime;
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
            'reason' => ['nullable', 'string', 'max:2000'],
            'operation' => ['sometimes', 'string', Rule::in(['transition', 'correct', 'reopen'])],
            'listing_id' => ['required', 'uuid', 'exists:listings,id'],
            'contact_id' => ['required', 'uuid', 'exists:contacts,id'],
            'agent_id' => ['required', 'integer', 'exists:users,id'],
            'status' => ['required', Rule::enum(ViewingStatus::class)],
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

            if (! $listing || ! app(OwnershipScope::class)->canAccess($this->user(), $listing, 'viewing.update')) {
                $validator->errors()->add('listing_id', 'You may only move viewings to assigned listings.');
            }

            if (! $this->user()?->hasRole('admin') && (int) $this->input('agent_id') !== (int) $this->user()?->getKey()) {
                $validator->errors()->add('agent_id', 'You may only assign viewings to yourself.');
            }
        });
    }
}
