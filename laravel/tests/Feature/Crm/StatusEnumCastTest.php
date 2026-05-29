<?php

namespace Tests\Feature\Crm;

use App\Enums\ContactRole;
use App\Enums\InquiryStatus;
use App\Enums\ListingStatus;
use App\Enums\OfferStatus;
use App\Enums\TaskStatus;
use App\Enums\ViewingStatus;
use App\Models\Contact;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\Offer;
use App\Models\Task;
use App\Models\Viewing;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StatusEnumCastTest extends TestCase
{
    use RefreshDatabase;

    public function test_crm_models_cast_status_and_role_fields_to_enums(): void
    {
        $contact = Contact::factory()->create(['role' => ContactRole::Owner]);
        $listing = Listing::factory()->create([
            'owner_contact_id' => $contact->id,
            'status' => ListingStatus::Active,
        ]);
        $inquiry = Inquiry::factory()->create([
            'listing_id' => $listing->id,
            'contact_id' => $contact->id,
            'status' => InquiryStatus::Qualified,
        ]);
        $viewing = Viewing::factory()->create([
            'listing_id' => $listing->id,
            'contact_id' => $contact->id,
            'status' => ViewingStatus::Completed,
        ]);
        $offer = Offer::factory()->create([
            'listing_id' => $listing->id,
            'contact_id' => $contact->id,
            'status' => OfferStatus::Accepted,
        ]);
        $task = Task::factory()->create([
            'status' => TaskStatus::InProgress,
            'related_entity_type' => $listing->getMorphClass(),
            'related_entity_id' => $listing->id,
        ]);

        $this->assertSame(ContactRole::Owner, $contact->fresh()->role);
        $this->assertSame(ListingStatus::Active, $listing->fresh()->status);
        $this->assertSame(InquiryStatus::Qualified, $inquiry->fresh()->status);
        $this->assertSame(ViewingStatus::Completed, $viewing->fresh()->status);
        $this->assertSame(OfferStatus::Accepted, $offer->fresh()->status);
        $this->assertSame(TaskStatus::InProgress, $task->fresh()->status);
    }

    public function test_status_enum_cases_use_title_case_keys(): void
    {
        $this->assertContains('UnderOffer', array_map(fn ($case) => $case->name, ListingStatus::cases()));
        $this->assertContains('NoShow', array_map(fn ($case) => $case->name, ViewingStatus::cases()));
        $this->assertContains('InProgress', array_map(fn ($case) => $case->name, TaskStatus::cases()));
    }
}
