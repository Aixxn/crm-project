<?php

namespace Tests\Feature\Rbac;

use App\Models\Contact;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\Note;
use App\Models\Offer;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Task;
use App\Models\User;
use App\Models\Viewing;
use App\Services\OwnershipScope;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OwnershipScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_access_any_entity_without_explicit_permission(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(Role::factory()->create(['key' => 'admin']));
        $listing = Listing::factory()->create();

        $this->assertTrue($this->scope()->canAccess($admin, $listing, 'listing.delete'));
    }

    public function test_agent_needs_permission_and_listing_ownership(): void
    {
        $agent = $this->agentWithPermission('listing.read');
        $ownListing = Listing::factory()->create(['assigned_agent_id' => $agent->id]);
        $otherListing = Listing::factory()->create();
        $agentWithoutPermission = $this->agentWithPermission('contact.read');

        $this->assertTrue($this->scope()->canAccess($agent, $ownListing, 'listing.read'));
        $this->assertFalse($this->scope()->canAccess($agent, $otherListing, 'listing.read'));
        $this->assertFalse($this->scope()->canAccess($agentWithoutPermission, $ownListing, 'listing.read'));
    }

    public function test_agent_can_access_records_tied_to_owned_listing(): void
    {
        $agent = $this->agentWithPermission('listing.read');
        $contact = Contact::factory()->create();
        $listing = Listing::factory()->create([
            'assigned_agent_id' => $agent->id,
            'owner_contact_id' => $contact->id,
        ]);
        $inquiry = Inquiry::factory()->create([
            'listing_id' => $listing->id,
            'contact_id' => $contact->id,
        ]);
        $viewing = Viewing::factory()->create([
            'listing_id' => $listing->id,
            'contact_id' => $contact->id,
            'agent_id' => $agent->id,
        ]);
        $offer = Offer::factory()->create([
            'listing_id' => $listing->id,
            'contact_id' => $contact->id,
        ]);
        $task = Task::factory()->create([
            'assignee_id' => $agent->id,
            'related_entity_type' => $listing->getMorphClass(),
            'related_entity_id' => $listing->id,
        ]);
        $note = Note::factory()->create([
            'author_id' => $agent->id,
            'related_entity_type' => $inquiry->getMorphClass(),
            'related_entity_id' => $inquiry->id,
        ]);

        $this->assertTrue($this->scope()->canAccess($agent, $inquiry, 'listing.read'));
        $this->assertTrue($this->scope()->canAccess($agent, $viewing, 'listing.read'));
        $this->assertTrue($this->scope()->canAccess($agent, $offer, 'listing.read'));
        $this->assertTrue($this->scope()->canAccess($agent, $contact, 'listing.read'));
        $this->assertTrue($this->scope()->canAccess($agent, $task, 'listing.read'));
        $this->assertTrue($this->scope()->canAccess($agent, $note, 'listing.read'));
    }

    public function test_agent_cannot_access_unlinked_contact(): void
    {
        $agent = $this->agentWithPermission('contact.read');
        $contact = Contact::factory()->create();

        $this->assertFalse($this->scope()->canAccess($agent, $contact, 'contact.read'));
    }

    public function test_contact_activity_replaces_preloaded_relations_with_authorized_collections(): void
    {
        $agent = $this->agentWithPermission('contact.read');
        $contact = Contact::factory()->create();
        $listing = Listing::factory()->create([
            'assigned_agent_id' => $agent->id,
            'owner_contact_id' => $contact->id,
        ]);
        $attributes = ['listing_id' => $listing->id, 'contact_id' => $contact->id];
        Inquiry::factory()->create($attributes);
        Viewing::factory()->create($attributes);
        Offer::factory()->create($attributes);
        $contact->load(['ownedListings', 'inquiries.listing', 'viewings.listing', 'offers.listing']);

        foreach (['ownedListings', 'inquiries', 'viewings', 'offers'] as $relation) {
            $this->assertCount(1, $contact->getRelation($relation));
        }

        $this->scope()->loadContactActivity($agent, $contact);

        foreach (['ownedListings', 'inquiries', 'viewings', 'offers'] as $relation) {
            $this->assertCount(0, $contact->getRelation($relation));
        }
    }

    private function agentWithPermission(string $permissionKey): User
    {
        $agent = User::factory()->create();
        $role = Role::factory()->create(['key' => 'agent-'.str_replace('.', '-', $permissionKey).'-'.Role::count()]);
        $permission = Permission::factory()->create(['key' => $permissionKey]);

        $role->addPermission($permission);
        $agent->assignRole($role);

        return $agent;
    }

    private function scope(): OwnershipScope
    {
        return app(OwnershipScope::class);
    }
}
