<?php

namespace App\Enums;

enum ResponsibilityRole: int
{
    case SALES = 1;
    case CUSTOMER = 2;
    case VEHICLE_DEPT = 3;
    case STORE_MANAGER = 4;
    case MARKETING = 5;
    case OTHER = 9;

    public function label(): string
    {
        return match($this) {
            self::SALES => '销售顾问',
            self::CUSTOMER => '客户原因',
            self::VEHICLE_DEPT => '车务部',
            self::STORE_MANAGER => '店长',
            self::MARKETING => '市场部',
            self::OTHER => '其他',
        };
    }
}
