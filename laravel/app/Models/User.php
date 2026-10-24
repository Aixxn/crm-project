<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

#[Fillable(['contact_id', 'name', 'email', 'password'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles')->withTimestamps();
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function savedListings(): HasMany
    {
        return $this->hasMany(SavedListing::class);
    }

    public function portalSearches(): HasMany
    {
        return $this->hasMany(PortalSearch::class);
    }

    public function assignedListings(): HasMany
    {
        return $this->hasMany(Listing::class, 'assigned_agent_id');
    }

    public function viewings(): HasMany
    {
        return $this->hasMany(Viewing::class, 'agent_id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class, 'assignee_id');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(Note::class, 'author_id');
    }

    private const CRM_PERMISSION_PREFIXES = [
        'listing.',
        'contact.',
        'inquiry.',
        'viewing.',
        'offer.',
        'task.',
        'note.',
        'user.',
    ];

    public function hasCrmAccess(): bool
    {
        if ($this->hasRole('admin') || $this->hasRole('agent')) {
            return true;
        }

        return $this->roles()
            ->whereHas('permissions', function ($query): void {
                $query->where(function ($query): void {
                    foreach (self::CRM_PERMISSION_PREFIXES as $prefix) {
                        $query->orWhere('key', 'like', $prefix.'%');
                    }
                });
            })
            ->exists();
    }

    public function sendEmailVerificationNotification(): void
    {
        DB::afterCommit(fn () => $this->notify(new VerifyEmail));
    }

    public function hasRole(string $roleKey): bool
    {
        return $this->roles()->where('key', $roleKey)->exists();
    }

    public function hasPermission(string $permissionKey): bool
    {
        if ($this->hasRole('admin')) {
            return true;
        }

        return $this->roles()
            ->whereHas('permissions', fn ($query) => $query->where('key', $permissionKey))
            ->exists();
    }

    public function assignRole(string|Role $role): void
    {
        $role = is_string($role)
            ? Role::query()->where('key', $role)->firstOrFail()
            : $role;

        $this->roles()->syncWithoutDetaching([
            $role->getKey() => ['id' => (string) Str::uuid()],
        ]);
    }

    public function revokeRole(string|Role $role): void
    {
        $role = is_string($role)
            ? Role::query()->where('key', $role)->first()
            : $role;

        if ($role instanceof Role) {
            $this->roles()->detach($role->getKey());
        }
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }
}
