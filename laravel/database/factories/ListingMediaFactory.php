<?php

namespace Database\Factories;

use App\Models\Listing;
use App\Models\ListingMedia;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ListingMedia>
 */
class ListingMediaFactory extends Factory
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
            'url' => fake()->imageUrl(),
            'type' => fake()->randomElement(['photo', 'floor_plan']),
            'sort_order' => fake()->numberBetween(0, 10),
        ];
    }
}
