<?php

namespace App\Models;

use Database\Factories\SavedListingFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class SavedListing extends Model
{
    /** @use HasFactory<SavedListingFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'user_id',
        'listing_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class);
    }
}
