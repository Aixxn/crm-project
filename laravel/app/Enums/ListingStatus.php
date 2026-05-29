<?php

namespace App\Enums;

enum ListingStatus: string
{
    case Draft = 'Draft';
    case Active = 'Active';
    case UnderOffer = 'Under Offer';
    case Closed = 'Closed';
    case ClosedLost = 'Closed Lost';
}
