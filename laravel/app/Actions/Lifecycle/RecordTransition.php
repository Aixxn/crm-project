<?php

namespace App\Actions\Lifecycle;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class RecordTransition
{
    public function handle(User $actor, Model $record, ?string $oldState, ?string $reason = null, string $operation = 'transition'): void
    {
        DB::table('state_transitions')->insert([
            'actor_id' => $actor->id,
            'entity_type' => $record::class,
            'entity_id' => $record->getKey(),
            'old_state' => $oldState,
            'new_state' => $record->status->value,
            'occurred_at' => now()->utc(),
            'reason' => $reason,
            'operation' => $operation,
        ]);
    }
}
