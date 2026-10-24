<?php

namespace App\Http\Requests\Notes;

use App\Models\Contact;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\Note;
use App\Models\Offer;
use App\Services\OwnershipScope;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreNoteRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('create', Note::class) ?? false;
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
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $relatedEntity = $this->relatedEntity();

            if (! $relatedEntity) {
                $validator->errors()->add('related_entity_id', 'The selected related record is invalid.');

                return;
            }

            if (! app(OwnershipScope::class)->canAccess($this->user(), $relatedEntity, 'note.create')) {
                $validator->errors()->add('related_entity_id', 'You may only create notes for accessible CRM records.');
            }
        });
    }

    /**
     * @return array<int, class-string>
     */
    private function allowedRelatedEntityTypes(): array
    {
        return OwnershipScope::PARENTS;
    }

    private function relatedEntity(): Contact|Inquiry|Listing|Offer|null
    {
        return app(OwnershipScope::class)->resolveParent($this->string('related_entity_type')->toString(), $this->string('related_entity_id')->toString());
    }
}
