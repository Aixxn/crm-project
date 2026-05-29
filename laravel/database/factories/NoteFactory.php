<?php

namespace Database\Factories;

use App\Models\Listing;
use App\Models\Note;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Note>
 */
class NoteFactory extends Factory
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
            'author_id' => User::factory(),
            'body' => fake()->paragraph(),
            'related_entity_type' => $listing->getMorphClass(),
            'related_entity_id' => $listing->getKey(),
        ];
    }
}
