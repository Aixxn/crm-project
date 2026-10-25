<?php

namespace Tests\Feature\Listings;

use App\Actions\Listings\CreateListing;
use App\Models\Listing;
use App\Models\ListingMedia;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class ListingMediaTransactionTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_failure_rolls_back_new_owner_listing_history_and_all_files(): void
    {
        Storage::fake('local');
        Storage::fake('public');
        $admin = User::factory()->create();
        $admin->assignRole(Role::factory()->create(['key' => 'admin']));
        ListingMedia::creating(fn () => throw new RuntimeException('Simulated metadata failure'));
        $this->withoutExceptionHandling();
        try {
            $this->actingAs($admin)->postJson(route('listings.store'), $this->attributes($admin));
            $this->fail('Expected media failure.');
        } catch (RuntimeException $error) {
            $this->assertSame('Simulated metadata failure', $error->getMessage());
        } finally {
            ListingMedia::flushEventListeners();
        }
        $this->assertDatabaseCount('contacts', 0);
        $this->assertDatabaseCount('listings', 0);
        $this->assertDatabaseCount('state_transitions', 0);
        $this->assertSame([], Storage::disk('public')->allFiles());
        $this->assertSame([], Storage::disk('local')->allFiles());
    }

    public function test_partial_public_write_is_compensated_and_a_fresh_retry_succeeds(): void
    {
        Storage::fake('local');
        $disk = Storage::fake('public');
        $mock = Mockery::mock($disk);
        $mock->shouldReceive('put')->once()->andReturnUsing(function ($path, $contents) use ($disk): bool {
            $disk->put($path, $contents);

            return false;
        });
        Storage::set('public', $mock);
        $admin = $this->admin();
        try {
            app(CreateListing::class)->handle($admin, $this->attributes($admin));
            $this->fail('Expected storage failure.');
        } catch (RuntimeException $error) {
            $this->assertSame('Unable to publish listing image.', $error->getMessage());
        }
        $this->assertDatabaseCount('listings', 0);
        $this->assertDatabaseCount('contacts', 0);
        $this->assertSame([], $disk->allFiles());
        $this->assertSame([], Storage::disk('local')->allFiles());
        Storage::set('public', $disk);
        $listing = app(CreateListing::class)->handle($admin, $this->attributes($admin));
        $this->assertSame('123.45', $listing->price);
        $this->assertCount(1, $listing->media);
        $this->assertCount(1, $disk->allFiles());
        $this->assertSame([], Storage::disk('local')->allFiles());
    }

    public function test_failed_private_staging_cleans_partial_bytes_before_any_database_write(): void
    {
        $disk = Storage::fake('local');
        Storage::fake('public');
        $mock = Mockery::mock($disk);
        $mock->shouldReceive('putFileAs')->once()->andReturnUsing(function ($directory, $image, $name) use ($disk): bool {
            $disk->putFileAs($directory, $image, $name);

            return false;
        });
        Storage::set('local', $mock);
        $admin = $this->admin();
        try {
            app(CreateListing::class)->handle($admin, $this->attributes($admin));
            $this->fail('Expected staging failure.');
        } catch (RuntimeException $error) {
            $this->assertSame('Unable to stage listing image.', $error->getMessage());
        }
        $this->assertDatabaseCount('listings', 0);
        $this->assertDatabaseCount('contacts', 0);
        $this->assertSame([], $disk->allFiles());
        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    public function test_outer_rollback_cleans_files_after_inner_transaction_commits(): void
    {
        Storage::fake('local');
        Storage::fake('public');
        $admin = $this->admin();
        DB::beginTransaction();
        $listing = app(CreateListing::class)->handle($admin, $this->attributes($admin));
        $this->assertCount(1, Storage::disk('public')->allFiles());
        DB::rollBack();
        $this->assertNull(Listing::find($listing->id));
        $this->assertDatabaseCount('contacts', 0);
        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    public function test_committed_nested_caller_still_compensates_on_ancestor_rollback(): void
    {
        Storage::fake('local');
        Storage::fake('public');
        $admin = $this->admin();
        DB::beginTransaction();
        DB::beginTransaction();
        $listing = app(CreateListing::class)->handle($admin, $this->attributes($admin));
        DB::commit();
        $this->assertCount(1, Storage::disk('public')->allFiles());
        DB::rollBack();
        $this->assertNull(Listing::find($listing->id));
        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    public function test_committed_caller_preserves_public_files_and_metadata(): void
    {
        Storage::fake('local');
        Storage::fake('public');
        $admin = $this->admin();
        DB::beginTransaction();
        $listing = app(CreateListing::class)->handle($admin, $this->attributes($admin));
        DB::commit();
        $this->assertNotNull(Listing::find($listing->id));
        $this->assertCount(1, $listing->media);
        $this->assertCount(1, Storage::disk('public')->allFiles());
    }

    public function test_cleanup_failure_is_logged_without_replacing_the_original_error(): void
    {
        Storage::fake('local');
        $disk = Storage::fake('public');
        $mock = Mockery::mock($disk);
        $mock->shouldReceive('delete')->andReturn(false);
        Storage::set('public', $mock);
        Log::shouldReceive('error')->once()->with('Listing media cleanup failed.', Mockery::on(fn ($context) => array_keys($context) === ['disk', 'path', 'operation']));
        ListingMedia::creating(fn () => throw new RuntimeException('Metadata unavailable'));
        try {
            app(CreateListing::class)->handle($this->admin(), $this->attributes($this->admin()));
            $this->fail('Expected metadata failure.');
        } catch (RuntimeException $error) {
            $this->assertSame('Metadata unavailable', $error->getMessage());
        } finally {
            ListingMedia::flushEventListeners();
            Storage::set('public', $disk);
            $disk->delete($disk->allFiles());
        }
        $this->assertDatabaseCount('listings', 0);
    }

    public function test_later_image_exception_rolls_back_prior_metadata_and_continues_cleanup_after_disk_and_logger_errors(): void
    {
        Storage::fake('local');
        $disk = Storage::fake('public');
        $mock = Mockery::mock($disk);
        $writes = 0;
        $mock->shouldReceive('put')->twice()->andReturnUsing(function ($path, $contents) use ($disk, &$writes): bool {
            $disk->put($path, $contents);
            if (++$writes === 2) {
                throw new RuntimeException('Second image failure');
            }

            return true;
        });
        $deletes = 0;
        $mock->shouldReceive('delete')->twice()->andReturnUsing(function ($path) use ($disk, &$deletes): bool {
            if (++$deletes === 1) {
                throw new RuntimeException('Cleanup disk unavailable');
            }

            return $disk->delete($path);
        });
        Storage::set('public', $mock);
        Log::shouldReceive('error')->once()->andThrow(new RuntimeException('Logger unavailable'));
        $admin = $this->admin();
        $attributes = $this->attributes($admin);
        $attributes['images'][] = UploadedFile::fake()->image('second.png');
        try {
            app(CreateListing::class)->handle($admin, $attributes);
            $this->fail('Expected later image failure.');
        } catch (RuntimeException $error) {
            $this->assertSame('Second image failure', $error->getMessage());
        } finally {
            Storage::set('public', $disk);
        }
        $this->assertSame(2, $deletes);
        $this->assertDatabaseCount('listing_media', 0);
        $this->assertDatabaseCount('listings', 0);
        $this->assertDatabaseCount('contacts', 0);
        $this->assertDatabaseCount('state_transitions', 0);
        $this->assertSame([], Storage::disk('local')->allFiles());
        $this->assertCount(1, $disk->allFiles());
        $disk->delete($disk->allFiles());
    }

    private function admin(): User
    {
        $admin = User::factory()->create();
        $admin->assignRole(Role::firstOrCreate(['key' => 'admin'], ['name' => 'Admin']));

        return $admin;
    }

    private function attributes(User $admin): array
    {
        return ['assigned_agent_id' => $admin->id, 'new_owner' => ['first_name' => 'Owner'], 'status' => 'Draft', 'address' => 'Test property', 'price' => '123.45', 'images' => [UploadedFile::fake()->image('front.jpg')]];
    }
}
