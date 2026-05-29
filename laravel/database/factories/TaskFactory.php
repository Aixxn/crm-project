<?php

namespace Database\Factories;

use App\Enums\TaskStatus;
use App\Models\Listing;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $listing = Listing::factory()->create();

        return [
            'assignee_id' => User::factory(),
            'title' => fake()->sentence(4),
            'due_date' => fake()->optional()->dateTimeBetween('now', '+14 days'),
            'status' => TaskStatus::Open,
            'related_entity_type' => $listing->getMorphClass(),
            'related_entity_id' => $listing->getKey(),
        ];
    }
}
