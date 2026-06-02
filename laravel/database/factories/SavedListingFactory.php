<?php

namespace Database\Factories;

use App\Models\Listing;
use App\Models\SavedListing;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SavedListing>
 */
class SavedListingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'listing_id' => Listing::factory(),
        ];
    }
}
