<?php

namespace App\Enums;

enum IntentLevel: int
{
    case LOW = 1;
    case MEDIUM = 2;
    case HIGH = 3;
    case VERY_HIGH = 4;
    case DEPOSITED = 5;

    public function label(): string
    {
        return match($this) {
            self::LOW => '低意向',
            self::MEDIUM => '中意向',
            self::HIGH => '高意向',
            self::VERY_HIGH => '极高意向',
            self::DEPOSITED => '已交订金',
        };
    }
}
