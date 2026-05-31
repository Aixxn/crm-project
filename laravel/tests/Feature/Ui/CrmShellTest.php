<?php

namespace Tests\Feature\Ui;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class CrmShellTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_open_minimal_crm_shell_destinations(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(Role::factory()->create(['key' => 'admin']));

        $routes = [
            ['dashboard', 'dashboard'],
            ['listings.index', 'listings/index'],
            ['contacts.index', 'contacts/index'],
            ['inquiries.index', 'inquiries/index'],
            ['viewings.index', 'viewings/index'],
            ['offers.index', 'offers/index'],
        ];

        foreach ($routes as [$routeName, $component]) {
            $this->actingAs($admin)
                ->get(route($routeName))
                ->assertOk()
                ->assertInertia(fn (AssertableInertia $page) => $page->component($component));
        }
    }
}
