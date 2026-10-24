<?php

namespace Tests\Feature\Workflows;

use App\Actions\Lifecycle\ChangeRecord;
use App\Actions\Lifecycle\RecordTransition;
use App\Actions\Viewings\RequestPublicViewing;
use App\Models\Contact;
use App\Models\Listing;
use App\Models\Offer;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class LifecycleConcurrencyTest extends TestCase
{
    private string $database;

    private string $previousConnection;

    protected function setUp(): void
    {
        parent::setUp();
        $this->database = tempnam(sys_get_temp_dir(), 'crm-lifecycle-');
        $this->previousConnection = config('database.default');
        config(['database.connections.lifecycle_test' => array_replace(config('database.connections.sqlite'), ['url' => null, 'database' => $this->database]), 'database.default' => 'lifecycle_test']);
        Artisan::call('migrate', ['--database' => 'lifecycle_test', '--force' => true]);
    }

    protected function tearDown(): void
    {
        DB::disconnect('lifecycle_test');
        config(['database.default' => $this->previousConnection]);
        foreach (glob($this->database.'*') as $path) {
            unlink($path);
        }
        parent::tearDown();
    }

    private function admin(): User
    {
        $actor = User::factory()->create();
        $actor->assignRole(Role::factory()->create(['key' => 'admin']));

        return $actor;
    }

    public function test_create_retry_uses_a_fresh_model_and_persists_one_record(): void
    {
        $actor = $this->admin();
        $listing = Listing::factory()->active()->create();
        $history = new RecordTransition;
        $attempts = 0;
        $this->mock(RecordTransition::class)->shouldReceive('handle')->twice()->andReturnUsing(function (...$arguments) use (&$attempts, $history): void {
            if (++$attempts === 1) {
                throw new \PDOException('database is locked');
            }
            $history->handle(...$arguments);
        });
        $offer = app(ChangeRecord::class)->create($actor, new Offer, ['listing_id' => $listing->id, 'contact_id' => $listing->owner_contact_id, 'status' => 'Submitted', 'amount' => '123.45']);
        $this->assertDatabaseCount('offers', 1);
        $this->assertDatabaseHas('offers', ['id' => $offer->id, 'amount' => '123.45']);
        $this->assertDatabaseCount('state_transitions', 1);
    }

    public function test_competing_processes_cannot_accept_two_offers_on_file_sqlite(): void
    {
        if (! function_exists('pcntl_fork')) {
            $this->markTestSkipped('pcntl is required for the SQLite process test.');
        }
        $actor = $this->admin();
        $listing = Listing::factory()->active()->create();
        $offers = Offer::factory()->count(2)->create(['listing_id' => $listing->id, 'status' => 'Submitted']);
        $results = $this->runConcurrent(function (int $index) use ($actor, $offers): void {
            app(ChangeRecord::class)->update(User::findOrFail($actor->id), Offer::findOrFail($offers[$index]->id), ['status' => 'Accepted']);
        });
        $this->assertSame(['accepted', 'rejected'], $results);
        $this->assertSame(1, Offer::where('listing_id', $listing->id)->where('status', 'Accepted')->count());
        $this->assertSame('Under Offer', $listing->refresh()->status->value);
        $this->assertDatabaseCount('state_transitions', 2);
    }

    public function test_competing_public_requests_create_one_viewing_and_one_inquiry(): void
    {
        $buyer = User::factory()->create(['contact_id' => Contact::factory()->create()->id]);
        $listing = Listing::factory()->active()->create();
        $time = now()->addDay()->toISOString();
        $results = $this->runConcurrent(function (int $index) use ($buyer, $listing, $time): void {
            $timeWithOffset = $index === 0 ? $time : Carbon::parse($time)->timezone('Asia/Manila')->toIso8601String();
            app(RequestPublicViewing::class)->handle(User::findOrFail($buyer->id), Listing::findOrFail($listing->id), $timeWithOffset, 'rent');
        });
        $this->assertSame(['accepted', 'rejected'], $results);
        $this->assertDatabaseCount('viewings', 1);
        $this->assertDatabaseCount('inquiries', 1);
        $this->assertDatabaseHas('inquiries', ['intent' => 'rent']);
        $this->assertDatabaseCount('state_transitions', 2);
    }

    /** @return array<int, string> */
    private function runConcurrent(\Closure $operation): array
    {
        if (! function_exists('pcntl_fork')) {
            $this->markTestSkipped('pcntl is required for the SQLite process test.');
        }
        DB::disconnect('lifecycle_test');
        $children = [];
        foreach ([0, 1] as $index) {
            $pid = pcntl_fork();
            if ($pid === -1) {
                $this->fail('Could not fork concurrency worker.');
            }
            if ($pid === 0) {
                DB::purge('lifecycle_test');
                touch($this->database.'.ready.'.$index);
                $deadline = microtime(true) + 5;
                while (! file_exists($this->database.'.start') && microtime(true) < $deadline) {
                    usleep(1000);
                }
                try {
                    $operation($index);
                    $result = 'accepted';
                } catch (ValidationException) {
                    $result = 'rejected';
                } catch (\Throwable $error) {
                    $result = $error::class;
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
