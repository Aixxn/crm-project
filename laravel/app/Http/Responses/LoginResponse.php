<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Laravel\Fortify\Fortify;

class LoginResponse implements LoginResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     */
    public function toResponse($request)
    {
        if ($request->wantsJson()) {
            return response()->json(['two_factor' => false]);
        }

        $user = $request->user();
        $destination = $user?->hasRole('admin') || $user?->hasRole('agent')
            ? Fortify::redirects('login')
            : route('public.my-home', absolute: false);

        return redirect()->intended($destination);
    }
}
