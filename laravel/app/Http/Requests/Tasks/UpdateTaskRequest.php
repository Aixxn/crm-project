<?php

namespace App\Http\Requests\Tasks;

use App\Enums\TaskStatus;
use App\Models\Contact;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\Offer;
use App\Models\User;
use App\Services\OwnershipScope;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaskRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('task')) ?? false;
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
            'assignee_id' => ['required', 'integer', 'exists:users,id'],
            'title' => ['required', 'string', 'max:255'],
            'due_date' => ['nullable', 'date'],
            'status' => ['required', Rule::enum(TaskStatus::class)],
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

            $assignee = User::query()->find($this->input('assignee_id'));
            if (! $assignee || ! $assignee->hasCrmAccess()) {
                $validator->errors()->add('assignee_id', 'The selected assignee is not eligible CRM staff.');
            }
            $relatedEntity = $this->relatedEntity();

            if (! $relatedEntity) {
                $validator->errors()->add('related_entity_id', 'The selected related record is invalid.');

                return;
            }

            if (! app(OwnershipScope::class)->canAccess($this->user(), $relatedEntity, 'task.update')) {
                $validator->errors()->add('related_entity_id', 'You may only move tasks to accessible CRM records.');
            }

            if (! $this->user()?->hasRole('admin') && (int) $this->input('assignee_id') !== (int) $this->user()?->getKey()) {
                $validator->errors()->add('assignee_id', 'You may only assign tasks to yourself.');
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
