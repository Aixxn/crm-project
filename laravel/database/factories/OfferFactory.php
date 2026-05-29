<?php

namespace Database\Factories;

use App\Enums\OfferStatus;
use App\Models\Contact;
use App\Models\Listing;
use App\Models\Offer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Offer>
 */
class OfferFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'listing_id' => Listing::factory(),
            'contact_id' => Contact::factory(),
            'status' => OfferStatus::Submitted,
            'amount' => fake()->numberBetween(250000, 2500000),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
