<?php

namespace App\Enums;

enum OfferStatus: string
{
    case Submitted = 'Submitted';
    case Accepted = 'Accepted';
    case Rejected = 'Rejected';
    case Withdrawn = 'Withdrawn';
}
