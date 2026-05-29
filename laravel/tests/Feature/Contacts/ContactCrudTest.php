<?php

namespace Tests\Feature\Contacts;

use App\Enums\ContactRole;
use App\Models\Contact;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContactCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_contact(): void
    {
        $admin = $this->userWithRoleAndPermissions('admin');

        $response = $this->actingAs($admin)->postJson(route('contacts.store'), $this->payload());

        $response->assertCreated()
            ->assertJsonPath('contact.first_name', 'Alex')
            ->assertJsonPath('contact.role', ContactRole::Buyer->value);

        $this->assertDatabaseHas('contacts', [
            'first_name' => 'Alex',
            'email' => 'alex@example.com',
        ]);
    }

    public function test_agent_can_create_contact_with_permission(): void
    {
        $agent = $this->userWithRoleAndPermissions('agent', ['contact.create']);

        $this->actingAs($agent)
            ->postJson(route('contacts.store'), $this->payload(['email' => 'agent-created@example.com']))
            ->assertCreated()
            ->assertJsonPath('contact.email', 'agent-created@example.com');
    }

    public function test_agent_index_is_scoped_to_contacts_linked_to_assigned_listings(): void
    {
        $agent = $this->userWithRoleAndPermissions('agent', ['contact.read']);
        $visibleOwner = Contact::factory()->create(['first_name' => 'Visible']);
        $visibleBuyer = Contact::factory()->create(['first_name' => 'Buyer']);
        $hiddenContact = Contact::factory()->create(['first_name' => 'Hidden']);
        $ownedListing = Listing::factory()->create([
            'assigned_agent_id' => $agent->id,
            'owner_contact_id' => $visibleOwner->id,
        ]);
        Inquiry::factory()->create([
            'listing_id' => $ownedListing->id,
            'contact_id' => $visibleBuyer->id,
        ]);
        Listing::factory()->create(['owner_contact_id' => $hiddenContact->id]);

        $response = $this->actingAs($agent)->getJson(route('contacts.index'));

        $response->assertOk()
            ->assertJsonFragment(['id' => $visibleOwner->id])
            ->assertJsonFragment(['id' => $visibleBuyer->id])
            ->assertJsonMissing(['id' => $hiddenContact->id]);
    }

    public function test_agent_can_view_update_and_delete_contact_linked_to_assigned_listing(): void
    {
        $agent = $this->userWithRoleAndPermissions('agent', [
            'contact.read',
            'contact.update',
            'contact.delete',
        ]);
        $contact = Contact::factory()->create();
        Listing::factory()->create([
            'assigned_agent_id' => $agent->id,
            'owner_contact_id' => $contact->id,
        ]);

        $this->actingAs($agent)->getJson(route('contacts.show', $contact))->assertOk();

        $this->actingAs($agent)
            ->putJson(route('contacts.update', $contact), $this->payload([
                'first_name' => 'Updated',
                'email' => 'updated@example.com',
            ]))
            ->assertOk()
            ->assertJsonPath('contact.first_name', 'Updated');

        $this->actingAs($agent)
            ->deleteJson(route('contacts.destroy', $contact))
            ->assertNoContent();

        $this->assertSoftDeleted('contacts', ['id' => $contact->id]);
    }

    public function test_agent_cannot_manage_unlinked_contact(): void
    {
        $agent = $this->userWithRoleAndPermissions('agent', [
            'contact.read',
            'contact.update',
            'contact.delete',
        ]);
        $contact = Contact::factory()->create();

        $this->actingAs($agent)->getJson(route('contacts.show', $contact))->assertForbidden();
        $this->actingAs($agent)->putJson(route('contacts.update', $contact), $this->payload())->assertForbidden();
        $this->actingAs($agent)->deleteJson(route('contacts.destroy', $contact))->assertForbidden();
    }

    public function test_store_contact_validates_required_fields(): void
    {
        $admin = $this->userWithRoleAndPermissions('admin');

        $response = $this->actingAs($admin)->postJson(route('contacts.store'), []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors([
                'role',
                'first_name',
            ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'role' => ContactRole::Buyer->value,
            'first_name' => 'Alex',
            'last_name' => 'Morgan',
            'email' => 'alex@example.com',
            'phone' => '+15555550100',
            'notes' => 'Interested in downtown condos.',
        ], $overrides);
    }

    /**
     * @param  array<int, string>  $permissionKeys
     */
    private function userWithRoleAndPermissions(string $roleKey, array $permissionKeys = []): User
    {
        $user = User::factory()->create();
        $role = Role::factory()->create([
            'key' => $roleKey === 'admin' ? 'admin' : $roleKey.'-'.Role::count(),
        ]);

        foreach ($permissionKeys as $permissionKey) {
            $role->addPermission(Permission::factory()->create(['key' => $permissionKey]));
        }

        $user->assignRole($role);

        return $user;
    }
}
