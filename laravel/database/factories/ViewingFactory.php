<?php

namespace Database\Factories;

use App\Enums\ViewingStatus;
use App\Models\Contact;
use App\Models\Listing;
use App\Models\User;
use App\Models\Viewing;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Viewing>
 */
class ViewingFactory extends Factory
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
            'agent_id' => User::factory(),
            'status' => ViewingStatus::Scheduled,
            'scheduled_at' => fake()->dateTimeBetween('now', '+30 days'),
        ];
    }
}
