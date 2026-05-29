<?php

namespace Database\Factories;

use App\Enums\InquiryStatus;
use App\Models\Contact;
use App\Models\Inquiry;
use App\Models\Listing;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Inquiry>
 */
class InquiryFactory extends Factory
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
            'status' => InquiryStatus::New,
            'source' => 'Manual',
            'intent' => fake()->randomElement(['buy', 'rent']),
            'budget' => fake()->optional()->numberBetween(250000, 2000000),
        ];
    }
}
