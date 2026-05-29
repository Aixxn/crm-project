<?php

namespace App\Enums;

enum ViewingStatus: string
{
    case Scheduled = 'Scheduled';
    case Completed = 'Completed';
    case NoShow = 'No Show';
    case Cancelled = 'Cancelled';
}
