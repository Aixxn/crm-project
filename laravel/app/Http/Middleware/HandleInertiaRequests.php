<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
            'notifications' => $this->notificationProps($request),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    /**
     * @return array{unreadCount: int, recent: array<int, array{id: string, title: string|null, message: string|null, href: string|null, status: string|null, price: float|null, createdAt: string|null}>}
     */
    private function notificationProps(Request $request): array
    {
        $user = $request->user();

        if (! $user || ! Schema::hasTable('notifications')) {
            return [
                'unreadCount' => 0,
                'recent' => [],
            ];
        }

        return [
            'unreadCount' => $user->unreadNotifications()->count(),
            'recent' => $user->unreadNotifications()
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn (DatabaseNotification $notification): array => [
                    'id' => $notification->id,
                    'title' => $notification->data['title'] ?? null,
                    'message' => $notification->data['message'] ?? null,
                    'href' => $notification->data['href'] ?? null,
                    'status' => $notification->data['status'] ?? null,
                    'price' => $notification->data['price'] ?? null,
                    'createdAt' => $notification->created_at?->diffForHumans(),
                ])
                ->all(),
        ];
    }
}
