<?php

namespace App\Services;

use App\Models\Contact;
use App\Models\User;

class BuyerPortalScope
{
    public function contact(User $user): Contact
    {
        $contact = $user->contact()->first();

        abort_unless($contact instanceof Contact, 409, 'Your portal profile needs attention. Please contact the agency.');

        return $contact;
    }
}
