<?php

namespace Database\Factories;

use App\Models\PortalSearch;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PortalSearch>
 */
class PortalSearchFactory extends Factory
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
            'name' => fake()->words(2, true),
            'filters' => [
                'search' => fake()->city(),
            ],
            'last_used_at' => now(),
        ];
    }
}
