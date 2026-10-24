<?php

namespace Tests\Feature\Contacts;

use App\Models\Contact;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContactIntakeTest extends TestCase
{
    use RefreshDatabase;

    public function test_agent_bootstraps_first_contact_with_listing(): void
    {
        $agent = $this->agent(['listing.create', 'contact.create']);
        $this->assertDatabaseCount('contacts', 0);
        $this->actingAs($agent)->postJson(route('listings.store'), $this->listingInput($agent))->assertCreated();
        $this->assertDatabaseCount('contacts', 1);
        $this->assertDatabaseHas('contacts', ['first_name' => 'New owner', 'role' => 'Owner']);
        $this->assertSame(Contact::first()->id, Listing::first()->owner_contact_id);
    }

    public function test_inquiry_creates_and_links_buyer(): void
    {
        $agent = $this->agent(['inquiry.create', 'contact.create']);
        $listing = Listing::factory()->create(['assigned_agent_id' => $agent->id]);
        $this->actingAs($agent)->postJson(route('inquiries.store'), $this->inquiryInput($listing))->assertCreated();
        $this->assertDatabaseHas('contacts', ['id' => Inquiry::first()->contact_id, 'role' => 'Buyer', 'first_name' => 'New buyer']);
    }

    public function test_new_contact_requires_contact_create_permission(): void
    {
        $agent = $this->agent(['listing.create', 'inquiry.create']);
        $this->actingAs($agent)->postJson(route('listings.store'), $this->listingInput($agent))->assertForbidden();
        $listing = Listing::factory()->create(['assigned_agent_id' => $agent->id]);
        $this->postJson(route('inquiries.store'), $this->inquiryInput($listing))->assertForbidden();
        $this->assertDatabaseMissing('contacts', ['first_name' => 'New owner']);
        $this->assertDatabaseMissing('contacts', ['first_name' => 'New buyer']);
    }

    public function test_existing_and_new_contact_are_mutually_exclusive(): void
    {
        $agent = $this->agent(['listing.create', 'inquiry.create', 'contact.create', 'contact.read']);
        $listing = Listing::factory()->create(['assigned_agent_id' => $agent->id]);
        $this->actingAs($agent)->postJson(route('listings.store'), [...$this->listingInput($agent), 'owner_contact_id' => $listing->owner_contact_id])->assertUnprocessable();
        $this->postJson(route('inquiries.store'), [...$this->inquiryInput($listing), 'contact_id' => $listing->owner_contact_id])->assertUnprocessable();
    }

    public function test_unrelated_and_deleted_contacts_cannot_be_attached(): void
    {
        $agent = $this->agent(['listing.create', 'inquiry.create', 'contact.read']);
        $listing = Listing::factory()->create(['assigned_agent_id' => $agent->id]);
        $unrelated = Contact::factory()->create();
        $deleted = $listing->owner;
        $deleted->delete();
        foreach ([$unrelated, $deleted] as $contact) {
            $input = $this->listingInput($agent);
            unset($input['new_owner']);
            $this->actingAs($agent)->postJson(route('listings.store'), [...$input, 'owner_contact_id' => $contact->id])->assertUnprocessable()->assertJsonValidationErrors('owner_contact_id');
            $input = $this->inquiryInput($listing);
            unset($input['new_contact']);
            $this->postJson(route('inquiries.store'), [...$input, 'contact_id' => $contact->id])->assertUnprocessable()->assertJsonValidationErrors('contact_id');
        }
    }

    public function test_listing_failure_rolls_back_new_contact(): void
    {
        $agent = $this->agent(['listing.create', 'contact.create']);
        Listing::creating(fn () => throw new \RuntimeException('Parent write failed'));
        $this->actingAs($agent)->postJson(route('listings.store'), $this->listingInput($agent))->assertServerError();
        $this->assertDatabaseCount('contacts', 0);
        $this->assertDatabaseCount('listings', 0);
    }

    public function test_inquiry_failure_rolls_back_new_contact(): void
    {
        $agent = $this->agent(['inquiry.create', 'contact.create']);
        $listing = Listing::factory()->create(['assigned_agent_id' => $agent->id]);
        Inquiry::creating(fn () => throw new \RuntimeException('Parent write failed'));
        $this->actingAs($agent)->postJson(route('inquiries.store'), $this->inquiryInput($listing))->assertServerError();
        $this->assertDatabaseMissing('contacts', ['first_name' => 'New buyer']);
        $this->assertDatabaseCount('inquiries', 0);
    }

    private function listingInput(User $agent): array
    {
        return ['assigned_agent_id' => $agent->id, 'new_owner' => ['first_name' => 'New owner'], 'address' => 'Test street', 'status' => 'Draft', 'price' => '150.25'];
    }

    private function inquiryInput(Listing $listing): array
    {
        return ['listing_id' => $listing->id, 'new_contact' => ['first_name' => 'New buyer'], 'status' => 'New', 'source' => 'Manual', 'intent' => 'buy'];
    }

    private function agent(array $permissions): User
    {
        $user = User::factory()->create();
        $role = Role::factory()->create(['key' => 'agent']);
        foreach ($permissions as $key) {
            $role->addPermission(Permission::factory()->create(['key' => $key]));
        }
        $user->assignRole($role);

        return $user;
    }
}
