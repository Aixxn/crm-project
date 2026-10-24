<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\VerifyEmailResponse as VerifyEmailResponseContract;

class VerifyEmailResponse implements VerifyEmailResponseContract
{
    public function toResponse($request)
    {
        if ($request->wantsJson()) {
            return response()->noContent();
        }

        $destination = $request->user()->hasCrmAccess()
            ? route('dashboard', absolute: false)
            : route('public.my-home', absolute: false);

        return redirect()->intended($destination.'?verified=1');
    }
}
