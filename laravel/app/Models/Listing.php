<?php

namespace App\Models;

use App\Enums\ListingStatus;
use Database\Factories\ListingFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Listing extends Model
{
    /** @use HasFactory<ListingFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'assigned_agent_id',
        'owner_contact_id',
        'status',
        'address',
        'property_type',
        'price',
        'bedrooms',
        'bathrooms',
        'area_sqft',
    ];

    protected function casts(): array
    {
        return [
            'status' => ListingStatus::class,
            'price' => 'decimal:2',
            'bathrooms' => 'decimal:1',
        ];
    }

    public function assignedAgent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_agent_id');
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'owner_contact_id');
    }

    public function media(): HasMany
    {
        return $this->hasMany(ListingMedia::class);
    }

    public function inquiries(): HasMany
    {
        return $this->hasMany(Inquiry::class);
    }

    public function viewings(): HasMany
    {
        return $this->hasMany(Viewing::class);
    }

    public function offers(): HasMany
    {
        return $this->hasMany(Offer::class);
    }

    public function tasks(): MorphMany
    {
        return $this->morphMany(Task::class, 'relatedEntity', 'related_entity_type', 'related_entity_id');
    }

    public function notes(): MorphMany
    {
        return $this->morphMany(Note::class, 'relatedEntity', 'related_entity_type', 'related_entity_id');
    }
}
