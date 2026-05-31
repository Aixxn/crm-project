<?php

namespace App\Http\Requests\Notes;

use App\Models\Contact;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\Offer;
use App\Services\OwnershipScope;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateNoteRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('note')) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'body' => ['required', 'string'],
            'related_entity_type' => ['required', 'string', Rule::in($this->allowedRelatedEntityTypes())],
            'related_entity_id' => ['required', 'uuid'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $relatedEntity = $this->relatedEntity();

            if (! $relatedEntity) {
                $validator->errors()->add('related_entity_id', 'The selected related record is invalid.');

                return;
            }

            if (! app(OwnershipScope::class)->canAccess($this->user(), $relatedEntity, 'note.update')) {
                $validator->errors()->add('related_entity_id', 'You may only move notes to accessible CRM records.');
            }
        });
    }

    /**
     * @return array<int, class-string>
     */
    private function allowedRelatedEntityTypes(): array
    {
        return [
            Listing::class,
            Inquiry::class,
            Contact::class,
            Offer::class,
        ];
    }

    private function relatedEntity(): Contact|Inquiry|Listing|Offer|null
    {
        $type = $this->string('related_entity_type')->toString();

        if (! in_array($type, $this->allowedRelatedEntityTypes(), true)) {
            return null;
        }

        return $type::query()->find($this->input('related_entity_id'));
    }
}
