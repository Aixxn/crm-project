<?php

namespace Database\Seeders;

use App\Enums\ContactRole;
use App\Enums\InquiryStatus;
use App\Enums\ListingStatus;
use App\Enums\OfferStatus;
use App\Enums\ViewingStatus;
use App\Models\Contact;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\ListingMedia;
use App\Models\Offer;
use App\Models\PortalSearch;
use App\Models\SavedListing;
use App\Models\User;
use App\Models\Viewing;
use Illuminate\Database\Seeder;

class BuyerPortalDemoSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@estatepro.test'],
            ['name' => 'EstatePro Admin', 'password' => 'password']
        );
        $admin->assignRole('admin');

        $agent = User::query()->updateOrCreate(
            ['email' => 'mia.agent@estatepro.test'],
            ['name' => 'Mia Santos', 'password' => 'password']
        );
        $agent->assignRole('agent');

        $secondAgent = User::query()->updateOrCreate(
            ['email' => 'noah.agent@estatepro.test'],
            ['name' => 'Noah Reyes', 'password' => 'password']
        );
        $secondAgent->assignRole('agent');

        $owner = Contact::query()->updateOrCreate(
            ['email' => 'owner.demo@estatepro.test'],
            [
                'role' => ContactRole::Owner,
                'first_name' => 'Olivia',
                'last_name' => 'Chen',
                'phone' => '+63 917 100 2000',
            ]
        );

        $buyerContact = Contact::query()->updateOrCreate(
            ['email' => 'buyer@estatepro.test'],
            [
                'role' => ContactRole::Buyer,
                'first_name' => 'Alex',
                'last_name' => 'Morgan',
                'phone' => '+63 917 300 4000',
            ]
        );

        $buyer = User::query()->updateOrCreate(
            ['email' => 'buyer@estatepro.test'],
            [
                'name' => 'Alex Morgan',
                'password' => 'password',
                'contact_id' => $buyerContact->getKey(),
            ]
        );

        $listings = collect([
            [
                'address' => '21 Ayala Avenue, Makati City',
                'property_type' => 'Condo',
                'price' => 24500000,
                'bedrooms' => 3,
                'bathrooms' => 2.5,
                'area_sqft' => 1560,
                'status' => ListingStatus::Active,
                'agent' => $agent,
                'media' => [
                    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85',
                    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85',
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
                ],
            ],
            [
                'address' => '8 Coral Way, Mactan Cebu',
                'property_type' => 'House',
                'price' => 18750000,
                'bedrooms' => 4,
                'bathrooms' => 3,
                'area_sqft' => 2400,
                'status' => ListingStatus::Active,
                'agent' => $secondAgent,
                'media' => [
                    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85',
                    'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=85',
                ],
            ],
            [
                'address' => '55 Bonifacio High Street, Taguig',
                'property_type' => 'Townhouse',
                'price' => 31200000,
                'bedrooms' => 3,
                'bathrooms' => 3.5,
                'area_sqft' => 2100,
                'status' => ListingStatus::UnderOffer,
                'agent' => $agent,
                'media' => [
                    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=85',
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
                ],
            ],
        ])->map(function (array $data) use ($owner): Listing {
            /** @var User $agent */
            $agent = $data['agent'];

            $listing = Listing::query()->updateOrCreate(
                ['address' => $data['address']],
                [
                    'assigned_agent_id' => $agent->getKey(),
                    'owner_contact_id' => $owner->getKey(),
                    'status' => $data['status'],
                    'property_type' => $data['property_type'],
                    'price' => $data['price'],
                    'bedrooms' => $data['bedrooms'],
                    'bathrooms' => $data['bathrooms'],
                    'area_sqft' => $data['area_sqft'],
                ]
            );

            collect($data['media'])->each(function (string $url, int $index) use ($listing): void {
                ListingMedia::query()->updateOrCreate(
                    ['listing_id' => $listing->getKey(), 'sort_order' => $index],
                    ['url' => $url, 'type' => 'photo']
                );
            });

            return $listing;
        });

        SavedListing::withTrashed()->firstOrCreate([
            'user_id' => $buyer->getKey(),
            'listing_id' => $listings[0]->getKey(),
        ])->restore();

        SavedListing::withTrashed()->firstOrCreate([
            'user_id' => $buyer->getKey(),
            'listing_id' => $listings[1]->getKey(),
        ])->restore();

        Inquiry::query()->updateOrCreate(
            [
                'listing_id' => $listings[0]->getKey(),
                'contact_id' => $buyerContact->getKey(),
            ],
            [
                'status' => InquiryStatus::Contacted,
                'source' => 'Public Portal',
                'intent' => 'buy',
                'budget' => 25000000,
                'message' => 'Please send the disclosure packet and dues.',
            ]
        );

        Viewing::query()->updateOrCreate(
            [
                'listing_id' => $listings[1]->getKey(),
                'contact_id' => $buyerContact->getKey(),
            ],
            [
                'agent_id' => $listings[1]->assigned_agent_id,
                'status' => ViewingStatus::Scheduled,
                'scheduled_at' => now()->addDays(3)->setTime(14, 0),
            ]
        );

        Offer::query()->updateOrCreate(
            [
                'listing_id' => $listings[2]->getKey(),
                'contact_id' => $buyerContact->getKey(),
            ],
            [
                'status' => OfferStatus::Submitted,
                'amount' => 30500000,
                'notes' => 'Buyer portal demo offer.',
            ]
        );

        PortalSearch::query()->updateOrCreate(
            [
                'user_id' => $buyer->getKey(),
                'name' => 'Makati condos, 3+ beds',
            ],
            [
                'filters' => ['search' => 'Makati', 'property_type' => 'Condo', 'bedrooms' => '3'],
                'last_used_at' => now(),
            ]
        );
    }
}
