<?php

namespace App\Enums;

enum ContactRole: string
{
    case Owner = 'Owner';
    case Buyer = 'Buyer';
    case Tenant = 'Tenant';
}
