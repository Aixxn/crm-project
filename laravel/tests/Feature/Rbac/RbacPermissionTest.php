<?php

namespace Tests\Feature\Rbac;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RbacPermissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_assign_revoke_and_check_roles(): void
    {
        $user = User::factory()->create();
        $role = Role::factory()->create(['key' => 'agent']);

        $this->assertFalse($user->hasRole('agent'));

        $user->assignRole($role);

        $this->assertTrue($user->hasRole('agent'));

        $user->revokeRole('agent');

        $this->assertFalse($user->hasRole('agent'));
    }

    public function test_user_permission_lookup_uses_custom_pivot_tables(): void
    {
        $user = User::factory()->create();
        $role = Role::factory()->create(['key' => 'agent']);
        $permission = Permission::factory()->create(['key' => 'listing.read']);

        $role->addPermission($permission);
        $user->assignRole($role);

        $this->assertTrue($user->hasPermission('listing.read'));
        $this->assertFalse($user->hasPermission('user.delete'));
    }

    public function test_admin_role_short_circuits_permission_checks(): void
    {
        $user = User::factory()->create();
        $admin = Role::factory()->create(['key' => 'admin']);

        $user->assignRole($admin);

        $this->assertTrue($user->hasPermission('anything.at-all'));
    }

    public function test_database_seeder_is_idempotent_for_roles_permissions_and_pivots(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(DatabaseSeeder::class);

        $this->assertSame(2, Role::count());
        $this->assertSame(32, Permission::count());
        $this->assertSame(1, User::where('email', 'test@example.com')->count());
        $this->assertTrue(User::where('email', 'test@example.com')->firstOrFail()->hasRole('admin'));
    }
}
