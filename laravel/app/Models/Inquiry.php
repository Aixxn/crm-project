<?php

namespace App\Models;

use App\Enums\InquiryStatus;
use Database\Factories\InquiryFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Inquiry extends Model
{
    /** @use HasFactory<InquiryFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'listing_id',
        'contact_id',
        'status',
        'source',
        'intent',
        'budget',
        'message',
    ];

    protected function casts(): array
    {
        return [
            'status' => InquiryStatus::class,
            'budget' => 'decimal:2',
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
}
