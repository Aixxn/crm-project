<?php

namespace App\Console\Commands;

use App\Actions\Identity\RepairPortalContact as RepairIdentity;
use Illuminate\Console\Command;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class RepairPortalContact extends Command
{
    protected $signature = 'portal:repair-contact {user : Target account ID} {--actor= : Administrator account ID} {--contact= : Existing contact UUID} {--create : Create a fresh Buyer contact if the association is missing}';

    protected $description = 'Explicitly repair a verified account association using an administrator account';

    public function handle(RepairIdentity $repair): int
    {
        $userId = filter_var($this->argument('user'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        $actorId = filter_var($this->option('actor'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        $contactId = $this->option('contact');
        $create = (bool) $this->option('create');

        if (! $userId || ! $actorId || ($contactId !== null) === $create || ($contactId !== null && ! Str::isUuid($contactId))) {
            $this->error('Provide valid account IDs and exactly one of --contact=<UUID> or --create.');

            return self::FAILURE;
        }

        try {
            $repair->handle($actorId, $userId, $contactId);
        } catch (HttpExceptionInterface $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->info('Portal association is ready.');

        return self::SUCCESS;
    }
}
