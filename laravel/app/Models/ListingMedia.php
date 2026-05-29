<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ListingMedia extends Model
{
    /** @use HasFactory<\Database\Factories\ListingMediaFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'listing_media';

    protected $fillable = [
        'listing_id',
        'url',
        'type',
        'sort_order',
    ];

    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class);
    }
}
