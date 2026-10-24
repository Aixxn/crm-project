<?php

namespace Tests\Feature\Contacts;

use App\Models\Contact;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\Offer;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Models\Viewing;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ContactVisibilityTest extends TestCase
{
    use RefreshDatabase;

    /** @param list<string> $permissions */
    #[DataProvider('visibilityCases')]
    public function test_contact_detail_filters_each_relation_and_nested_listing(string $format, array $permissions, bool $admin): void
    {
        $user = $this->staff($permissions, $admin);
        $contact = Contact::factory()->create();
        $own = $this->activity($contact, $user);
        $other = $this->activity($contact, User::factory()->create());

        $response = $this->detail($user, $contact, $format)->assertOk();
        $payload = $this->contactPayload($response, $format);

        $this->assertSame($contact->id, $payload['id']);

        foreach (['owned_listings' => 'listing', 'inquiries' => 'inquiry', 'viewings' => 'viewing', 'offers' => 'offer'] as $relation => $resource) {
            $expected = $admin ? [$own[$relation], $other[$relation]] : (in_array($resource.'.read', $permissions, true) ? [$own[$relation]] : []);
            $this->assertEqualsCanonicalizing($expected, array_column($payload[$relation], 'id'), $relation);
            $this->assertTrue(array_is_list($payload[$relation]), $relation.' must remain a JSON array');

            if ($relation === 'owned_listings') {
                continue;
            }

            foreach ($payload[$relation] as $record) {
                if ($admin || in_array('listing.read', $permissions, true)) {
                    $expectedListing = $record['id'] === $own[$relation] ? $own['owned_listings'] : $other['owned_listings'];
                    $this->assertSame($expectedListing, $record['listing']['id']);
                } else {
                    $this->assertArrayHasKey('listing', $record);
                    $this->assertNull($record['listing']);
                }
            }
        }
    }

    public static function visibilityCases(): iterable
    {
        $cases = [
            'contact only' => [[], false],
            'listing only' => [['listing.read'], false],
            'inquiry only' => [['inquiry.read'], false],
            'viewing only' => [['viewing.read'], false],
            'offer only' => [['offer.read'], false],
            'activity without listings' => [['inquiry.read', 'viewing.read', 'offer.read'], false],
            'all resources' => [['listing.read', 'inquiry.read', 'viewing.read', 'offer.read'], false],
            'admin bypass' => [[], true],
        ];

        foreach (['json', 'inertia'] as $format) {
            foreach ($cases as $name => [$permissions, $admin]) {
                yield $format.' '.$name => [$format, $admin ? [] : ['contact.read', ...$permissions], $admin];
            }
        }
    }

    #[DataProvider('formats')]
    public function test_contact_detail_omits_deleted_activity_and_activity_with_deleted_listings(string $format): void
    {
        $user = $this->staff(['contact.read', 'listing.read', 'inquiry.read', 'viewing.read', 'offer.read']);
        $contact = Contact::factory()->create();
        $visible = $this->activity($contact, $user);
        $deletedParent = $this->activity($contact, $user);
        Listing::findOrFail($deletedParent['owned_listings'])->delete();
        $deletedActivity = $this->activity($contact, $user);
        Inquiry::findOrFail($deletedActivity['inquiries'])->delete();
        Viewing::findOrFail($deletedActivity['viewings'])->delete();
        Offer::findOrFail($deletedActivity['offers'])->delete();

        $payload = $this->contactPayload($this->detail($user, $contact, $format)->assertOk(), $format);

        $this->assertEqualsCanonicalizing([$visible['owned_listings'], $deletedActivity['owned_listings']], array_column($payload['owned_listings'], 'id'));
        foreach (['inquiries', 'viewings', 'offers'] as $relation) {
            $this->assertSame([$visible[$relation]], array_column($payload[$relation], 'id'), $relation);
        }
    }

    #[DataProvider('formats')]
    public function test_contact_detail_denies_unlinked_contacts_and_missing_contact_permission(string $format): void
    {
        $contact = Contact::factory()->create();
        $unlinked = $this->staff(['contact.read']);
        $this->detail($unlinked, $contact, $format)->assertForbidden();

        $withoutPermission = $this->staff(['listing.read']);
        $this->activity($contact, $withoutPermission);
        $this->detail($withoutPermission, $contact, $format)->assertForbidden();
    }

    public static function formats(): iterable
    {
        yield 'json' => ['json'];
        yield 'inertia' => ['inertia'];
    }

    /** @param list<string> $permissions */
    private function staff(array $permissions, bool $admin = false): User
    {
        $user = User::factory()->create();
        $role = Role::factory()->create($admin ? ['key' => 'admin'] : []);
        foreach ($permissions as $key) {
            $role->addPermission(Permission::query()->firstOrCreate(['key' => $key], ['name' => $key]));
        }
        $user->assignRole($role);

        return $user;
    }

    /** @return array<string, string> */
    private function activity(Contact $contact, User $agent): array
    {
        $listing = Listing::factory()->create(['owner_contact_id' => $contact->id, 'assigned_agent_id' => $agent->id]);
        $attributes = ['contact_id' => $contact->id, 'listing_id' => $listing->id];

        return [
            'owned_listings' => $listing->id,
            'inquiries' => Inquiry::factory()->create($attributes)->id,
            'viewings' => Viewing::factory()->create([...$attributes, 'agent_id' => $agent->id])->id,
            'offers' => Offer::factory()->create($attributes)->id,
        ];
    }

    private function detail(User $user, Contact $contact, string $format): TestResponse
    {
        $this->actingAs($user);

        return $format === 'json'
            ? $this->getJson(route('contacts.show', $contact))
            : $this->get(route('contacts.show', $contact));
    }

    /** @return array<string, mixed> */
    private function contactPayload(TestResponse $response, string $format): array
    {
        if ($format === 'json') {
            return $response->json('contact');
        }

        $response->assertInertia(fn (AssertableInertia $page) => $page->component('contacts/show')->has('contact'));

        return $response->viewData('page')['props']['contact'];
    }
}
