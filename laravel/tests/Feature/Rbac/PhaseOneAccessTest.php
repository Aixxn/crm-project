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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class PhaseOneAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_options_only_return_readable_assigned_contacts(): void
    {
        $user = $this->staff(['listing.create', 'contact.read']);
        $own = Contact::factory()->create();
        Listing::factory()->create(['assigned_agent_id' => $user->id, 'owner_contact_id' => $own->id]);
        Contact::factory()->create();
        $this->actingAs($user)->get(route('listings.create'))->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->has('owners', 1)->where('owners.0.id', $own->id));
    }

    public function test_contact_parent_tasks_and_notes_have_list_detail_parity_without_parent_permission(): void
    {
        $user = $this->staff(['task.read', 'note.read']);
        $contact = Contact::factory()->create();
        Listing::factory()->create(['assigned_agent_id' => $user->id, 'owner_contact_id' => $contact->id]);
        foreach (['tasks' => Task::class, 'notes' => Note::class] as $route => $class) {
            $record = $class::factory()->create(['related_entity_type' => Contact::class, 'related_entity_id' => $contact->id]);
            $this->actingAs($user)->getJson(route($route.'.index'))->assertOk()->assertJsonPath($route.'.data.0.id', $record->id)->assertJsonPath($route.'.data.0.related_entity', null);
            $this->getJson(route($route.'.show', $record))->assertOk()->assertJsonPath(rtrim($route, 's').'.related_entity', null);
        }
    }

    public function test_dashboard_denies_unrelated_resources_to_task_only_staff(): void
    {
        $user = $this->staff(['task.read']);
        $listing = Listing::factory()->create(['assigned_agent_id' => $user->id, 'status' => 'Active']);
        Inquiry::factory()->create(['listing_id' => $listing->id]);
        Task::factory()->create(['related_entity_type' => Listing::class, 'related_entity_id' => $listing->id, 'status' => 'Open']);
        $this->actingAs($user)->get(route('dashboard'))->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->where('kpis.activeListings', 0)->where('kpis.newInquiries', 0)->has('activeListings', 0)->has('recentActivity', 0)->has('openTasks', 1));
    }

    public function test_listing_nested_activity_requires_each_resource_permission(): void
    {
        $user = $this->staff(['listing.read']);
        $listing = Listing::factory()->create(['assigned_agent_id' => $user->id]);
        Inquiry::factory()->create(['listing_id' => $listing->id]);
        Offer::factory()->create(['listing_id' => $listing->id]);
        $this->actingAs($user)->getJson(route('listings.show', $listing))->assertOk()->assertJsonPath('listing.owner', null)->assertJsonCount(0, 'listing.inquiries')->assertJsonCount(0, 'listing.offers');
    }

    public function test_shared_contact_identity_cannot_be_edited_or_deleted_by_agent(): void
    {
        $user = $this->staff(['contact.update', 'contact.delete', 'contact.create']);
        $contact = Contact::factory()->create();
        Listing::factory()->create(['assigned_agent_id' => $user->id, 'owner_contact_id' => $contact->id]);
        $other = Listing::factory()->create();
        Offer::factory()->create(['listing_id' => $other->id, 'contact_id' => $contact->id]);
        $this->actingAs($user)->get(route('contacts.edit', $contact))->assertForbidden();
        $this->deleteJson(route('contacts.destroy', $contact))->assertForbidden();
        $this->get(route('contacts.create'))->assertForbidden();
    }

    public function test_contact_parent_tasks_and_notes_support_create_update_and_inertia_reads(): void
    {
        $user = $this->staff(['task.read', 'task.create', 'task.update', 'note.read', 'note.create', 'note.update']);
        $contact = Contact::factory()->create();
        Listing::factory()->create(['assigned_agent_id' => $user->id, 'owner_contact_id' => $contact->id]);
        foreach (['tasks' => 'task', 'notes' => 'note'] as $route => $resource) {
            $payload = ['related_entity_type' => Contact::class, 'related_entity_id' => $contact->id];
            $payload += $resource === 'task' ? ['title' => 'Follow up', 'status' => 'Open', 'assignee_id' => $user->id] : ['body' => 'Follow up'];
            $response = $this->actingAs($user)->postJson(route($route.'.store'), $payload)->assertCreated();
            $id = $response->json($resource.'.id');
            $this->putJson(route($route.'.update', $id), $payload)->assertOk();
            foreach (['show', 'edit'] as $action) {
                $this->get(route($route.'.'.$action, $id))->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->where($resource.'.id', $id)->where($resource.'.related_entity', null));
            }
            $this->get(route($route.'.index'))->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->has($route.'.data', 1)->where($route.'.data.0.related_entity', null)->has('relatedEntities', 0));
            $other = Contact::factory()->create();
            $this->putJson(route($route.'.update', $id), [...$payload, 'related_entity_id' => $other->id])->assertUnprocessable()->assertJsonValidationErrors('related_entity_id');
            $this->assertDatabaseHas($route, ['id' => $id, 'related_entity_id' => $contact->id]);
        }
    }

    public function test_admin_cannot_read_or_mutate_unknown_and_deleted_task_note_parents(): void
    {
        $admin = $this->staff([]);
        $admin->assignRole(Role::factory()->create(['key' => 'admin']));
        $deleted = Listing::factory()->create();
        $deleted->delete();
        foreach ([['Missing\\Model', $deleted->id], [Listing::class, $deleted->id]] as [$type, $id]) {
            foreach (['tasks' => Task::class, 'notes' => Note::class] as $route => $class) {
                $record = $class::factory()->create(['related_entity_type' => $type, 'related_entity_id' => $id]);
                $this->actingAs($admin)->getJson(route($route.'.show', $record))->assertForbidden();
                $this->get(route($route.'.show', $record))->assertForbidden();
                $this->deleteJson(route($route.'.destroy', $record))->assertForbidden();
                $this->getJson(route($route.'.index'))->assertOk()->assertJsonCount(0, $route.'.data');
                $payload = ['related_entity_type' => $type, 'related_entity_id' => $id, 'assignee_id' => $admin->id, 'title' => 'Task', 'status' => 'Open', 'body' => 'Note'];
                $field = $type === Listing::class ? 'related_entity_id' : 'related_entity_type';
                $this->postJson(route($route.'.store'), $payload)->assertUnprocessable()->assertJsonValidationErrors($field);
            }
        }
    }

    public function test_activity_reads_omit_listing_and_contact_without_their_permissions(): void
    {
        $user = $this->staff(['inquiry.read', 'offer.read', 'viewing.read']);
        $listing = Listing::factory()->create(['assigned_agent_id' => $user->id]);
        foreach (['inquiries' => Inquiry::class, 'offers' => Offer::class, 'viewings' => Viewing::class] as $route => $class) {
            $record = $class::factory()->create(['listing_id' => $listing->id]);
            $resource = $route === 'inquiries' ? 'inquiry' : rtrim($route, 's');
            $this->actingAs($user)->getJson(route($route.'.show', $record))->assertOk()->assertJsonPath($resource.'.listing', null)->assertJsonPath($resource.'.contact', null);
            $this->get(route($route.'.show', $record))->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->where($resource.'.listing', null)->where($resource.'.contact', null));
            $this->getJson(route($route.'.index'))->assertOk()->assertJsonPath($route.'.data.0.listing', null)->assertJsonPath($route.'.data.0.contact', null);
            $other = $class::factory()->create();
            $this->getJson(route($route.'.show', $other))->assertForbidden();
            $this->get(route($route.'.show', $other))->assertForbidden();
        }
    }

    public function test_activity_submitted_contacts_and_destination_listings_are_rechecked(): void
    {
        $user = $this->staff(['offer.create', 'offer.update', 'viewing.create', 'viewing.update', 'inquiry.update', 'contact.read']);
        $listing = Listing::factory()->create(['assigned_agent_id' => $user->id, 'status' => 'Active']);
        $contact = $listing->owner;
        $other = Contact::factory()->create();
        $deleted = Contact::factory()->create();
        $deleted->delete();
        $foreignListing = Listing::factory()->create();
        $deletedListing = Listing::factory()->create(['assigned_agent_id' => $user->id]);
        $deletedListing->delete();
        foreach (['offers' => Offer::class, 'viewings' => Viewing::class, 'inquiries' => Inquiry::class] as $route => $class) {
            $payload = ['listing_id' => $listing->id, 'contact_id' => $contact->id];
            $payload += match ($route) {
                'offers' => ['status' => 'Submitted', 'amount' => 100],
                'viewings' => ['status' => 'Scheduled', 'agent_id' => $user->id, 'scheduled_at' => now()->addDay()->toISOString()],
                'inquiries' => ['status' => 'New', 'source' => 'Manual', 'intent' => 'buy'],
            };
            $record = $class::factory()->create(['listing_id' => $listing->id, 'contact_id' => $contact->id]);
            $this->actingAs($user);
            foreach ([$other, $deleted] as $invalid) {
                $invalidPayload = [...$payload, 'contact_id' => $invalid->id];
                $this->putJson(route($route.'.update', $record), $invalidPayload)->assertUnprocessable()->assertJsonValidationErrors('contact_id');
                if ($route !== 'inquiries') {
                    $this->postJson(route($route.'.store'), $invalidPayload)->assertUnprocessable()->assertJsonValidationErrors('contact_id');
                }
            }
            foreach ([$foreignListing, $deletedListing] as $invalid) {
                $this->putJson(route($route.'.update', $record), [...$payload, 'listing_id' => $invalid->id])->assertUnprocessable()->assertJsonValidationErrors('listing_id');
            }
            $this->assertDatabaseHas($route, ['id' => $record->id, 'listing_id' => $listing->id, 'contact_id' => $contact->id]);
        }
    }

    public function test_listing_inertia_nested_counts_and_labels_are_permission_scoped(): void
    {
        $user = $this->staff(['listing.read']);
        $listing = Listing::factory()->create(['assigned_agent_id' => $user->id, 'status' => 'Active']);
        Inquiry::factory()->create(['listing_id' => $listing->id]);
        $this->actingAs($user)->get(route('listings.show', $listing))->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->where('listing.owner', null)->has('listing.inquiries', 0)->has('listing.offers', 0)->has('listing.viewings', 0)->has('listing.tasks', 0)->has('listing.notes', 0));
        $this->get(route('dashboard'))->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->where('activeListings.0.inquiries_count', 0));
    }

    public function test_shared_contact_edit_checks_all_live_link_types_and_ignores_deleted_links(): void
    {
        $user = $this->staff(['contact.read', 'contact.update']);
        foreach ([Listing::class, Inquiry::class, Offer::class, Viewing::class] as $type) {
            $contact = Contact::factory()->create();
            Listing::factory()->create(['assigned_agent_id' => $user->id, 'owner_contact_id' => $contact->id]);
            $other = Listing::factory()->create();
            $link = $type === Listing::class ? $other : $type::factory()->create(['listing_id' => $other->id, 'contact_id' => $contact->id]);
            if ($type === Listing::class) {
                $other->update(['owner_contact_id' => $contact->id]);
            }
            $this->actingAs($user)->get(route('contacts.edit', $contact))->assertForbidden();
            $this->getJson(route('contacts.show', $contact))->assertOk()->assertJsonPath('contact.can_update', false)->assertJsonPath('contact.can_delete', false);
            $link->delete();
            $this->get(route('contacts.edit', $contact))->assertOk();
            $this->getJson(route('contacts.show', $contact))->assertOk()->assertJsonPath('contact.can_update', true);
        }
    }

    public function test_existing_task_and_note_parent_must_be_accessible_before_reparenting(): void
    {
        $user = $this->staff(['task.update', 'note.update']);
        $own = Listing::factory()->create(['assigned_agent_id' => $user->id]);
        $other = Listing::factory()->create();
        foreach (['tasks' => Task::class, 'notes' => Note::class] as $route => $class) {
            $record = $class::factory()->create(['related_entity_type' => Listing::class, 'related_entity_id' => $other->id]);
            $this->actingAs($user)->putJson(route($route.'.update', $record), ['related_entity_type' => Listing::class, 'related_entity_id' => $own->id, 'assignee_id' => $user->id, 'title' => 'Task', 'status' => 'Open', 'body' => 'Note'])->assertForbidden();
            $this->assertDatabaseHas($route, ['id' => $record->id, 'related_entity_id' => $other->id]);
        }
    }

    public function test_inquiry_only_dashboard_omits_listing_labels_and_other_resource_counts(): void
    {
        $user = $this->staff(['inquiry.read']);
        $listing = Listing::factory()->create(['assigned_agent_id' => $user->id]);
        Inquiry::factory()->create(['listing_id' => $listing->id, 'status' => 'New']);
        $this->actingAs($user)->get(route('dashboard'))->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->where('kpis.newInquiries', 1)->where('kpis.activeListings', 0)->has('recentActivity', 1)->where('recentActivity.0.title', 'Inquiry')->has('activeListings', 0));
    }

    public function test_owner_options_require_contact_read_even_when_contact_is_linked(): void
    {
        $user = $this->staff(['listing.create']);
        Listing::factory()->create(['assigned_agent_id' => $user->id]);
        $this->actingAs($user)->get(route('listings.create'))->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->has('owners', 0)->where('canCreateContact', false));
    }

    private function staff(array $permissions): User
    {
        $user = User::factory()->create();
        $role = Role::factory()->create();
        foreach ($permissions as $key) {
            $role->addPermission(Permission::query()->firstOrCreate(['key' => $key], ['name' => $key]));
        }
        $user->assignRole($role);

        return $user;
    }
}
