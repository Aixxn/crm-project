<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $adminRole = $this->role('admin', 'Admin', 'Can manage every CRM record and setting.');
        $agentRole = $this->role('agent', 'Agent', 'Can manage assigned listings and related records.');

        $adminPermissions = collect([
            'listing',
            'inquiry',
            'viewing',
            'offer',
            'task',
            'note',
            'contact',
            'user',
        ])->flatMap(fn (string $resource) => $this->permissionKeys($resource));

        $agentPermissions = collect([
            'listing',
            'inquiry',
            'viewing',
            'offer',
            'task',
            'note',
            'contact',
        ])->flatMap(fn (string $resource) => $this->permissionKeys($resource));

        $permissions = $adminPermissions
            ->unique()
            ->mapWithKeys(fn (string $key) => [
                $key => $this->permission($key, "Allows {$key}."),
            ]);

        $adminRole->permissions()->sync($this->pivotIds($permissions->pluck('id')->all()));
        $agentRole->permissions()->sync($this->pivotIds(
            $agentPermissions->map(fn (string $key) => $permissions[$key]->id)->all()
        ));

        $user = User::query()->updateOrCreate(
            ['email' => 'test@example.com'],
            ['name' => 'Test User', 'password' => 'password']
        );

        $user->assignRole($adminRole);

        $this->call(BuyerPortalDemoSeeder::class);
    }

    private function role(string $key, string $name, string $description): Role
    {
        $role = Role::withTrashed()->updateOrCreate(
            ['key' => $key],
            ['name' => $name, 'description' => $description]
        );

        if ($role->trashed()) {
            $role->restore();
        }

        return $role;
    }

    private function permission(string $key, string $description): Permission
    {
        $permission = Permission::withTrashed()->updateOrCreate(
            ['key' => $key],
            ['description' => $description]
        );

        if ($permission->trashed()) {
            $permission->restore();
        }

        return $permission;
    }

    /**
     * @return array<int, string>
     */
    private function permissionKeys(string $resource): array
    {
        return [
            "{$resource}.read",
            "{$resource}.create",
            "{$resource}.update",
            "{$resource}.delete",
        ];
    }

    /**
     * @param  array<int, string>  $ids
     * @return array<string, array{id: string}>
     */
    private function pivotIds(array $ids): array
    {
        return collect($ids)
            ->mapWithKeys(fn (string $id) => [$id => ['id' => (string) Str::uuid()]])
            ->all();
    }
}
