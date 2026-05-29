<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Role extends Model
{
    /** @use HasFactory<\Database\Factories\RoleFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'key',
        'name',
        'description',
    ];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_roles')->withTimestamps();
    }

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_permissions')->withTimestamps();
    }

    public function addPermission(string|Permission $permission): void
    {
        $permission = is_string($permission)
            ? Permission::query()->where('key', $permission)->firstOrFail()
            : $permission;

        $this->permissions()->syncWithoutDetaching([
            $permission->getKey() => ['id' => (string) Str::uuid()],
        ]);
    }

    public function removePermission(string|Permission $permission): void
    {
        $permission = is_string($permission)
            ? Permission::query()->where('key', $permission)->first()
            : $permission;

        if ($permission instanceof Permission) {
            $this->permissions()->detach($permission->getKey());
        }
    }
}
