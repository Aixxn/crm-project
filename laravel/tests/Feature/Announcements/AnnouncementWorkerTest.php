<?php

namespace Tests\Feature\Announcements;

use App\Actions\Announcements\AcceptListingAnnouncement;
use App\Actions\Announcements\DeliverListingAnnouncementChunk;
use App\Enums\ContactRole;
use App\Models\Contact;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use RuntimeException;
use Tests\TestCase;

class AnnouncementWorkerTest extends TestCase
{
    private string $database;

    private string $previousConnection;

    protected function setUp(): void
    {
        parent::setUp();
        $this->database = tempnam(sys_get_temp_dir(), 'crm-announcements-');
        $this->previousConnection = config('database.default');
        config([
            'database.connections.announcement_test' => array_replace(config('database.connections.sqlite'), ['url' => null, 'database' => $this->database]),
            'database.default' => 'announcement_test',
            'queue.connections.database.connection' => 'announcement_test',
            'queue.failed.database' => 'announcement_test',
            'services.listing_webhook.secret' => 'test-secret',
        ]);
        Artisan::call('migrate', ['--database' => 'announcement_test', '--force' => true]);
    }

    protected function tearDown(): void
    {
        DB::disconnect('announcement_test');
        config(['database.default' => $this->previousConnection]);
        foreach (glob($this->database.'*') as $path) {
            unlink($path);
        }
        parent::tearDown();
    }

    public function test_actual_database_queue_worker_recovers_lost_next_chunk_and_delivers_once(): void
    {
        $listing = Listing::factory()->active()->create();
        for ($index = 0; $index < 53; $index++) {
            $this->buyer();
        }
        $id = app(AcceptListingAnnouncement::class)->handle('worker-event', $listing->id);
        $this->assertDatabaseCount('jobs', 1);
        $this->assertDatabaseCount('notifications', 0);
        $this->workOnce();
        $this->assertDatabaseCount('listing_announcement_deliveries', 50);
        $this->assertDatabaseCount('jobs', 1);
        $this->assertNull(DB::table('listing_announcements')->where('id', $id)->value('completed_at'));
        DB::table('jobs')->delete();
        $this->artisan('announcements:recover')->assertSuccessful();
        $this->workOnce();
        $this->assertDatabaseCount('notifications', 53);
        $this->assertDatabaseCount('jobs', 0);
        $this->assertDatabaseCount('failed_jobs', 0);
        $this->assertNotNull(DB::table('listing_announcements')->where('id', $id)->value('completed_at'));
        app(AcceptListingAnnouncement::class)->handle('worker-event', $listing->id);
        $this->workOnce();
        $this->assertDatabaseCount('notifications', 53);
    }

    public function test_outer_rollback_discards_receipt_and_after_commit_dispatch(): void
    {
        $listing = Listing::factory()->active()->create();
        DB::beginTransaction();
        app(AcceptListingAnnouncement::class)->handle('rolled-back-event', $listing->id);
        $this->assertDatabaseCount('listing_announcements', 1);
        $this->assertDatabaseCount('jobs', 0);
        DB::rollBack();
        $this->assertDatabaseCount('listing_announcements', 0);
        $this->assertDatabaseCount('jobs', 0);
    }

    public function test_post_commit_queue_failure_returns_receipt_and_recovery_delivers_it(): void
    {
        $listing = Listing::factory()->active()->create();
        $this->buyer();
        $manager = Queue::getFacadeRoot();
        Queue::shouldReceive('connection')->once()->with('database')->andThrow(new RuntimeException('Simulated queue unavailable'));
        $body = json_encode(['event_id' => 'queue-outage', 'listing_id' => $listing->id]);
        $timestamp = now()->timestamp;
        $response = $this->call('POST', '/webhooks/v2/listings/offered', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json', 'HTTP_X_WEBHOOK_TIMESTAMP' => (string) $timestamp, 'HTTP_X_WEBHOOK_SIGNATURE' => hash_hmac('sha256', $timestamp.'.'.$body, 'test-secret')], $body);
        $response->assertAccepted()->assertJsonStructure(['receipt_id']);
        $this->assertDatabaseCount('listing_announcements', 1);
        $this->assertDatabaseCount('jobs', 0);
        Queue::swap($manager);
        $this->artisan('announcements:recover')->assertSuccessful();
        $this->workOnce();
        $this->assertDatabaseCount('notifications', 1);
        $this->assertNotNull(DB::table('listing_announcements')->value('completed_at'));
    }

    public function test_real_failed_job_leaves_incomplete_receipt_for_recovery(): void
    {
        $listing = Listing::factory()->active()->create();
        $this->buyer();
        $this->buyer();
        $id = app(AcceptListingAnnouncement::class)->handle('failed-job-event', $listing->id);
        DB::table('jobs')->update(['attempts' => 4]);
        $fail = true;
        DB::listen(function ($query) use (&$fail): void {
            if ($fail && str_starts_with($query->sql, 'insert into "notifications"')) {
                throw new RuntimeException('Simulated isolated recipient storage outage');
            }
        });
        $this->workOnce();
        $this->assertDatabaseCount('failed_jobs', 1);
        $this->assertDatabaseCount('notifications', 0);
        $this->assertDatabaseCount('listing_announcement_deliveries', 0);
        $this->assertDatabaseHas('listing_announcements', ['id' => $id, 'recipient_cursor' => 0, 'completed_at' => null]);
        $fail = false;
        $this->artisan('announcements:recover')->assertSuccessful();
        $this->workOnce();
        $this->assertDatabaseCount('notifications', 2);
        $this->assertNotNull(DB::table('listing_announcements')->where('id', $id)->value('completed_at'));
    }

    public function test_concurrent_receipt_replays_and_duplicate_deliveries_are_unique_on_file_sqlite(): void
    {
        $listing = Listing::factory()->active()->create();
        $this->buyer();
        $this->buyer();
        $results = $this->concurrently(fn () => app(AcceptListingAnnouncement::class)->handle('concurrent-event', $listing->id));
        $this->assertSame(['ok', 'ok'], $results);
        $this->assertDatabaseCount('listing_announcements', 1);
        $id = DB::table('listing_announcements')->value('id');
        $results = $this->concurrently(fn () => app(DeliverListingAnnouncementChunk::class)->handle($id));
        $this->assertSame(['ok', 'ok'], $results);
        $this->assertDatabaseCount('notifications', 2);
        $this->assertSame(2, DB::table('listing_announcement_deliveries')->where('outcome', 'delivered')->count());
    }

    private function workOnce(): void
    {
        $exit = Artisan::call('queue:work', ['connection' => 'database', '--queue' => 'announcements', '--once' => true, '--sleep' => 0, '--tries' => 1, '--timeout' => 10]);
        $this->assertSame(0, $exit, Artisan::output());
    }

    private function buyer(): User
    {
        return User::factory()->create(['contact_id' => Contact::factory()->create(['role' => ContactRole::Buyer])->id]);
    }

    private function concurrently(\Closure $operation): array
    {
        if (! function_exists('pcntl_fork')) {
            $this->markTestSkipped('pcntl is required for SQLite concurrency verification.');
        }
        foreach (array_merge(glob($this->database.'.ready.*'), glob($this->database.'.result.*')) as $path) {
            unlink($path);
        }
        if (file_exists($this->database.'.start')) {
            unlink($this->database.'.start');
        }
        DB::disconnect('announcement_test');
        $children = [];
        foreach ([0, 1] as $index) {
            $pid = pcntl_fork();
            if ($pid === -1) {
                $this->fail('Could not fork concurrency worker.');
            }
            if ($pid === 0) {
                DB::purge('announcement_test');
                touch($this->database.'.ready.'.$index);
                $deadline = microtime(true) + 5;
                while (! file_exists($this->database.'.start') && microtime(true) < $deadline) {
                    usleep(1000);
                }
                try {
                    $operation();
                    $result = 'ok';
                } catch (\Throwable $error) {
                    $result = $error::class.': '.$error->getMessage();
                }
                file_put_contents($this->database.'.result.'.$index, $result);
                exit(0);
            }
            $children[] = $pid;
        }
        $deadline = microtime(true) + 5;
        while ((! file_exists($this->database.'.ready.0') || ! file_exists($this->database.'.ready.1')) && microtime(true) < $deadline) {
            usleep(1000);
        }
        touch($this->database.'.start');
        foreach ($children as $pid) {
            pcntl_waitpid($pid, $status);
            $this->assertTrue(pcntl_wifexited($status));
            $this->assertSame(0, pcntl_wexitstatus($status));
        }
        $results = [file_get_contents($this->database.'.result.0'), file_get_contents($this->database.'.result.1')];
        sort($results);

        return $results;
    }
}
