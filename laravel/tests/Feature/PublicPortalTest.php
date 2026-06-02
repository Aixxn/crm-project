<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class PublicPortalTest extends TestCase
{
    public function test_public_landing_page_renders(): void
    {
        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('welcome')
            );
    }

    public function test_public_buyer_lister_pages_render(): void
    {
        $routes = [
            ['public.browse', 'public/browse'],
            ['public.property.show', 'public/property'],
            ['public.my-home', 'public/my-home'],
            ['public.deal-tracker', 'public/deal-tracker'],
            ['public.settings', 'public/settings'],
        ];

        foreach ($routes as [$routeName, $component]) {
            $this->get(route($routeName))
                ->assertOk()
                ->assertInertia(fn (AssertableInertia $page) => $page
                    ->component($component)
                );
        }
    }
}
