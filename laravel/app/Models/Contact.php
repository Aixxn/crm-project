<?php

namespace App\Models;

use App\Enums\ContactRole;
use Database\Factories\ContactFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contact extends Model
{
    /** @use HasFactory<ContactFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'role',
        'first_name',
        'last_name',
        'email',
        'phone',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'role' => ContactRole::class,
        ];
    }

    public function ownedListings(): HasMany
    {
        return $this->hasMany(Listing::class, 'owner_contact_id');
    }

    public function user(): HasOne
    {
        return $this->hasOne(User::class);
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
}
