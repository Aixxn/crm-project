<?php

namespace App\Enums;

enum InquiryStatus: string
{
    case New = 'New';
    case Contacted = 'Contacted';
    case Qualified = 'Qualified';
    case Converted = 'Converted';
    case Closed = 'Closed';
}
