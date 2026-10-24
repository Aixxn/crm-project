<?php

namespace App\Http\Responses;

use Laravel\Fortify\Http\Responses\RedirectAsIntended as FortifyRedirect;

class RedirectAsIntended extends FortifyRedirect
{
    public function toResponse($request)
    {
        if ($this->name !== 'email-verification') {
            return parent::toResponse($request);
        }

        $destination = $request->user()->hasCrmAccess()
            ? route('dashboard', absolute: false)
            : route('public.my-home', absolute: false);

        return redirect()->intended($destination);
    }
}
