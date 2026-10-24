<?php

namespace Tests\Feature\Auth;

use App\Models\Contact;
use App\Models\Listing;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicPortalAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_portal_user_cannot_open_crm_pages(): void
    {
        $user = User::factory()->create();

        $crmRoutes = [
            'dashboard',
            'listings.index',
            'contacts.index',
            'inquiries.index',
            'viewings.index',
            'offers.index',
            'tasks.index',
            'notes.index',
            'profile.edit',
            'security.edit',
        ];

        foreach ($crmRoutes as $routeName) {
            $this->actingAs($user)
                ->get(route($routeName))
                ->assertRedirect(route('public.my-home', absolute: false));
        }
    }

    public function test_public_portal_user_can_open_buyer_lister_pages(): void
    {
        $user = User::factory()->create(['contact_id' => Contact::factory()->create()->id]);
        $listing = Listing::factory()->active()->create();

        $publicRoutes = [
            route('home'),
            route('public.browse'),
            route('public.property.show', $listing),
            route('public.my-home'),
            route('public.deal-tracker'),
            route('public.settings'),
        ];

        foreach ($publicRoutes as $url) {
            $this->actingAs($user)
                ->get($url)
                ->assertOk();
        }
    }

    public function test_admin_and_agent_users_can_open_dashboard(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(Role::factory()->create(['key' => 'admin']));

        $agent = User::factory()->create();
        $agent->assignRole(Role::factory()->create(['key' => 'agent']));

        $this->actingAs($admin)
            ->get(route('dashboard'))
            ->assertOk();

        $this->actingAs($agent)
            ->get(route('dashboard'))
            ->assertOk();
    }
}
