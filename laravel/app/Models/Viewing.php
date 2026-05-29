<?php

namespace App\Models;

use App\Enums\ViewingStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Viewing extends Model
{
    /** @use HasFactory<\Database\Factories\ViewingFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'listing_id',
        'contact_id',
        'agent_id',
        'status',
        'scheduled_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => ViewingStatus::class,
            'scheduled_at' => 'datetime',
        ];
    }

    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }
}
