<?php

namespace Database\Factories;

use App\Enums\ListingStatus;
use App\Models\Contact;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Listing>
 */
class ListingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'assigned_agent_id' => User::factory(),
            'owner_contact_id' => Contact::factory(),
            'status' => ListingStatus::Draft,
            'address' => fake()->streetAddress(),
            'property_type' => fake()->randomElement(['House', 'Condo', 'Townhouse']),
            'price' => fake()->numberBetween(250000, 2500000),
            'bedrooms' => fake()->numberBetween(1, 5),
            'bathrooms' => fake()->randomFloat(1, 1, 4),
            'area_sqft' => fake()->numberBetween(600, 5000),
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ListingStatus::Active,
        ]);
    }
}
