<?php

namespace Database\Factories;

use App\Models\Location;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class TourFactory extends Factory
{
    public function definition(): array
    {
        $title = fake('ar_EG')->words(3, true);
        $price = fake()->numberBetween(2000, 12000);

        return [
            'location_id'   => Location::inRandomOrder()->value('id'),
            'title'         => $title,
            'slug'          => Str::slug($title) . '-' . Str::random(4),
            'short_desc'    => fake('ar_EG')->sentence(),
            'content'       => fake('ar_EG')->paragraph(),
            'price'         => $price,
            'sale_price'    => fake()->boolean(30) ? $price * 0.85 : null,
            'duration_days' => fake()->numberBetween(1, 7),
            'max_people'    => fake()->numberBetween(2, 30),
            'is_featured'   => fake()->boolean(25),
            'is_guaranteed' => fake()->boolean(80),
            'status'        => 'publish',
            'review_score'  => fake()->randomFloat(1, 4, 5),
            'review_count'  => fake()->numberBetween(0, 400),
        ];
    }
}
