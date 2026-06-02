<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasCrmAccess
{
    /**
     * @var array<int, string>
     */
    private const CRM_PERMISSION_PREFIXES = [
        'listing.',
        'contact.',
        'inquiry.',
        'viewing.',
        'offer.',
        'task.',
        'note.',
        'user.',
    ];

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $this->hasCrmAccess($request->user())) {
            return redirect()->route('public.my-home');
        }

        return $next($request);
    }

    private function hasCrmAccess(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        if ($user->hasRole('admin') || $user->hasRole('agent')) {
            return true;
        }

        return $user->roles()
            ->whereHas('permissions', function ($query): void {
                $query->where(function ($query): void {
                    foreach (self::CRM_PERMISSION_PREFIXES as $prefix) {
                        $query->orWhere('key', 'like', $prefix.'%');
                    }
                });
            })
            ->exists();
    }
}
