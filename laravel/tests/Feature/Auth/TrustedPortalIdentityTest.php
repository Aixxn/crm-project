<?php

namespace Tests\Feature\Auth;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Identity\RepairPortalContact;
use App\Enums\ContactRole;
use App\Enums\ListingStatus;
use App\Models\Contact;
use App\Models\Listing;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use RuntimeException;
use Tests\TestCase;

class TrustedPortalIdentityTest extends TestCase
{
    use RefreshDatabase;

    public function test_unverified_accounts_cannot_write_portal_records(): void
    {
        $contact = Contact::factory()->create();
        $user = User::factory()->unverified()->create(['contact_id' => $contact->id]);
        $listing = Listing::factory()->active()->create();
        $this->actingAs($user);

        $this->postJson(route('public.inquiries.store', $listing), ['intent' => 'buy'])->assertForbidden();
        $this->postJson(route('public.viewing-requests.store', $listing), ['scheduled_at' => now()->addDay()->toIso8601String()])->assertForbidden();
        $this->postJson(route('public.saved-listings.store'), ['listing_id' => $listing->id])->assertForbidden();
        $this->postJson(route('public.recent-searches.store'), ['filters' => []])->assertForbidden();
        $this->putJson(route('public.settings.update'), ['first_name' => 'Changed'])->assertForbidden();
        $this->assertDatabaseCount('inquiries', 0);
        $this->assertDatabaseCount('viewings', 0);
        $this->assertDatabaseCount('saved_listings', 0);
        $this->assertDatabaseCount('portal_searches', 0);
        $this->assertSame($contact->first_name, $contact->fresh()->first_name);
    }

    public function test_portal_gets_never_claim_matching_live_or_deleted_contacts(): void
    {
        foreach ([false, true] as $deleted) {
            $contact = Contact::factory()->create(['role' => ContactRole::Buyer]);
            if ($deleted) {
                $contact->delete();
            }
            $user = User::factory()->create(['email' => $contact->email, 'contact_id' => null]);
            $before = Contact::withTrashed()->count();

            foreach (['public.my-home', 'public.deal-tracker', 'public.settings'] as $route) {
                $this->actingAs($user)->get(route($route))->assertStatus(409);
            }

            $this->assertNull($user->fresh()->contact_id);
            $this->assertSame($before, Contact::withTrashed()->count());
            $this->assertSame($deleted, $contact->fresh()->trashed());
        }
    }

    public function test_deleted_link_is_refused_without_restoration(): void
    {
        $contact = Contact::factory()->create();
        $user = User::factory()->create(['contact_id' => $contact->id]);
        $contact->delete();
        $this->actingAs($user)->get(route('public.my-home'))->assertStatus(409);
        $this->assertTrue($contact->fresh()->trashed());
    }

    public function test_registration_rolls_back_when_contact_save_fails(): void
    {
        Contact::creating(fn () => throw new RuntimeException('Injected contact save failure'));
        try {
            app(CreateNewUser::class)->create($this->registration());
            $this->fail('Registration should fail.');
        } catch (RuntimeException $exception) {
            $this->assertSame('Injected contact save failure', $exception->getMessage());
        }
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('contacts', 0);
    }

    public function test_registration_rolls_back_when_user_link_save_fails(): void
    {
        User::updating(fn () => throw new RuntimeException('Injected link save failure'));
        try {
            app(CreateNewUser::class)->create($this->registration());
            $this->fail('Registration should fail.');
        } catch (RuntimeException $exception) {
            $this->assertSame('Injected link save failure', $exception->getMessage());
        }
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('contacts', 0);
    }

    public function test_registration_creates_fresh_identity_despite_duplicate_crm_email(): void
    {
        Notification::fake();
        $first = Contact::factory()->create(['email' => 'new@example.test']);
        $second = Contact::factory()->create(['email' => 'new@example.test']);
        $second->delete();

        $this->post(route('register.store'), $this->registration())->assertRedirect(route('login'));
        $user = User::query()->sole();
        $this->assertNotContains($user->contact_id, [$first->id, $second->id]);
        $this->assertSame(ContactRole::Buyer, $user->contact->role);
        $this->assertNull($user->email_verified_at);
        $this->assertTrue($second->fresh()->trashed());
        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_admin_can_explicitly_link_verified_account_and_retry(): void
    {
        $admin = $this->admin();
        $user = User::factory()->create();
        $contact = Contact::factory()->create();
        foreach ([1, 2] as $attempt) {
            $this->artisan('portal:repair-contact', ['user' => $user->id, '--actor' => $admin->id, '--contact' => $contact->id])->assertSuccessful();
        }
        $this->assertSame($contact->id, $user->fresh()->contact_id);
        $this->assertDatabaseCount('contacts', 1);
    }

    public function test_admin_can_create_fresh_link_and_retry_without_duplicate_contact(): void
    {
        $admin = $this->admin();
        $user = User::factory()->create();
        foreach ([1, 2] as $attempt) {
            $this->artisan('portal:repair-contact', ['user' => $user->id, '--actor' => $admin->id, '--create' => true])->assertSuccessful();
        }
        $this->assertNotNull($user->fresh()->contact_id);
        $this->assertDatabaseCount('contacts', 1);
        $this->assertSame(ContactRole::Buyer, $user->fresh()->contact->role);
    }

    public function test_repair_rejects_nonadmin_unverified_taken_deleted_or_mismatched_links(): void
    {
        $admin = $this->admin();
        $target = User::factory()->create();
        $contact = Contact::factory()->create();
        $other = User::factory()->create(['contact_id' => $contact->id]);
        $deleted = Contact::factory()->create();
        $deleted->delete();
        $unverified = User::factory()->unverified()->create();
        $free = Contact::factory()->create();

        foreach ([
            [$target, $target, $free],
            [$admin, $unverified, $free],
            [$admin, $target, $contact],
            [$admin, $target, $deleted],
            [$admin, $other, $free],
        ] as [$actor, $user, $requested]) {
            $this->artisan('portal:repair-contact', ['user' => $user->id, '--actor' => $actor->id, '--contact' => $requested->id])->assertFailed();
        }
        $this->assertNull($target->fresh()->contact_id);
        $this->assertNull($unverified->fresh()->contact_id);
        $this->assertSame($contact->id, $other->fresh()->contact_id);
        $this->assertTrue($deleted->fresh()->trashed());
    }

    public function test_registration_notification_waits_for_commit_and_is_discarded_on_rollback(): void
    {
        Notification::fake();
        DB::beginTransaction();
        $this->post(route('register.store'), $this->registration())->assertRedirect(route('login'));
        $user = User::query()->sole();
        Notification::assertNothingSent();
        DB::rollBack();
        Notification::assertNothingSent();
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('contacts', 0);

        DB::beginTransaction();
        $this->post(route('register.store'), $this->registration())->assertRedirect(route('login'));
        $user = User::query()->sole();
        Notification::assertNothingSent();
        DB::commit();
        Notification::assertSentTo($user, VerifyEmail::class);
        $this->assertNotNull($user->fresh()->contact_id);
    }

    public function test_missing_and_deleted_associations_cannot_write_or_claim_another_contact(): void
    {
        $listing = Listing::factory()->active()->create();
        $foreign = Contact::factory()->create();
        foreach ([false, true] as $deleted) {
            $contact = Contact::factory()->create();
            $user = User::factory()->create(['contact_id' => $deleted ? $contact->id : null]);
            if ($deleted) {
                $contact->delete();
            }
            $this->actingAs($user);
            $this->postJson(route('public.inquiries.store', $listing), ['intent' => 'buy', 'contact_id' => $foreign->id])->assertStatus(409);
            $this->postJson(route('public.viewing-requests.store', $listing), ['scheduled_at' => now()->addDay()->toIso8601String(), 'contact_id' => $foreign->id])->assertStatus(409);
            $this->putJson(route('public.settings.update'), ['first_name' => 'Changed', 'contact_id' => $foreign->id])->assertStatus(409);
            $this->assertSame($deleted ? $contact->id : null, $user->fresh()->contact_id);
        }
        $this->assertDatabaseCount('inquiries', 0);
        $this->assertDatabaseCount('viewings', 0);
        $this->assertSame($foreign->first_name, $foreign->fresh()->first_name);
    }

    public function test_portal_writes_ignore_submitted_contact_identity(): void
    {
        $own = Contact::factory()->create();
        $foreign = Contact::factory()->create();
        $user = User::factory()->create(['contact_id' => $own->id]);
        $listing = Listing::factory()->active()->create();
        $this->actingAs($user);
        $this->post(route('public.inquiries.store', $listing), ['intent' => 'buy', 'contact_id' => $foreign->id])->assertRedirect();
        $this->post(route('public.viewing-requests.store', $listing), ['scheduled_at' => now()->addDay()->toIso8601String(), 'contact_id' => $foreign->id])->assertRedirect();
        $this->put(route('public.settings.update'), ['first_name' => 'Own Updated', 'contact_id' => $foreign->id])->assertRedirect();
        $this->assertDatabaseHas('inquiries', ['listing_id' => $listing->id, 'contact_id' => $own->id]);
        $this->assertDatabaseHas('viewings', ['listing_id' => $listing->id, 'contact_id' => $own->id]);
        $this->assertDatabaseMissing('inquiries', ['contact_id' => $foreign->id]);
        $this->assertSame('Own Updated', $own->fresh()->first_name);
        $this->assertSame($foreign->first_name, $foreign->fresh()->first_name);
    }

    public function test_portal_identity_does_not_authorize_unpublished_listings(): void
    {
        $contact = Contact::factory()->create();
        $user = User::factory()->create(['contact_id' => $contact->id]);
        $listing = Listing::factory()->create(['status' => ListingStatus::Draft]);
        $this->actingAs($user);
        $this->post(route('public.inquiries.store', $listing), ['intent' => 'buy'])->assertNotFound();
        $this->post(route('public.viewing-requests.store', $listing), ['scheduled_at' => now()->addDay()->toIso8601String()])->assertNotFound();
        $this->post(route('public.saved-listings.store'), ['listing_id' => $listing->id])->assertNotFound();
        $this->assertDatabaseCount('inquiries', 0);
        $this->assertDatabaseCount('viewings', 0);
        $this->assertDatabaseCount('saved_listings', 0);
    }

    public function test_repair_fresh_contact_creation_rolls_back_if_link_save_fails(): void
    {
        $admin = $this->admin();
        $target = User::factory()->create();
        User::updating(fn () => throw new RuntimeException('Injected link save failure'));
        try {
            app(RepairPortalContact::class)->handle($admin->id, $target->id);
            $this->fail('Repair should fail.');
        } catch (RuntimeException $exception) {
            $this->assertSame('Injected link save failure', $exception->getMessage());
        }
        $this->assertNull($target->fresh()->contact_id);
        $this->assertDatabaseCount('contacts', 0);
    }

    public function test_repair_requires_explicit_operation_and_actor_and_will_not_restore_deleted_link(): void
    {
        $admin = $this->admin();
        $contact = Contact::factory()->create();
        $target = User::factory()->create(['contact_id' => $contact->id]);
        $contact->delete();
        foreach ([
            ['user' => $target->id, '--create' => true],
            ['user' => $target->id, '--actor' => $admin->id],
            ['user' => $target->id, '--actor' => $admin->id, '--contact' => $contact->id, '--create' => true],
            ['user' => $target->id, '--actor' => $admin->id, '--create' => true],
            ['user' => 999, '--actor' => $admin->id, '--create' => true],
        ] as $arguments) {
            $this->artisan('portal:repair-contact', $arguments)->assertFailed();
        }
        $this->assertTrue($contact->fresh()->trashed());
        $this->assertSame($contact->id, $target->fresh()->contact_id);
        $this->assertSame(1, Contact::withTrashed()->count());
    }

    public function test_database_enforces_one_account_per_contact(): void
    {
        $contact = Contact::factory()->create();
        User::factory()->create(['contact_id' => $contact->id]);
        $this->expectException(UniqueConstraintViolationException::class);
        User::factory()->create(['contact_id' => $contact->id]);
    }

    public function test_custom_staff_login_and_email_verification_use_crm_destination(): void
    {
        $role = Role::factory()->create();
        $role->addPermission(Permission::factory()->create(['key' => 'task.read']));
        $user = User::factory()->unverified()->create();
        $user->assignRole($role);
        $this->assertTrue($user->hasCrmAccess());
        $this->post(route('login.store'), ['email' => $user->email, 'password' => 'password'])->assertRedirect(route('verification.notice'));
        $url = URL::temporarySignedRoute('verification.verify', now()->addHour(), ['id' => $user->id, 'hash' => sha1($user->email)]);
        $this->get($url)->assertRedirect(route('dashboard', absolute: false).'?verified=1');
        $this->get(route('verification.notice'))->assertRedirect(route('dashboard', absolute: false));
        $this->post(route('verification.send'))->assertRedirect(route('dashboard', absolute: false));
        $this->post(route('logout'));
        $this->post(route('login.store'), ['email' => $user->email, 'password' => 'password'])->assertRedirect(route('dashboard', absolute: false));
    }

    private function admin(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Role::factory()->create(['key' => 'admin']));

        return $user;
    }

    private function registration(): array
    {
        return ['name' => 'New Buyer', 'email' => 'new@example.test', 'password' => 'password', 'password_confirmation' => 'password'];
    }
}
