<?php

namespace App\Enums;

enum TestDriveStatus: int
{
    case PENDING = 10;
    case CONFIRMED = 20;
    case IN_PROGRESS = 30;
    case COMPLETED = 40;
    case CANCELLED = 50;
    case NO_SHOW = 60;
    case CLOSED = 70;

    public function label(): string
    {
        return match($this) {
            self::PENDING => '待确认',
            self::CONFIRMED => '已确认',
            self::IN_PROGRESS => '试驾中',
            self::COMPLETED => '已完成',
            self::CANCELLED => '已取消',
            self::NO_SHOW => '已爽约',
            self::CLOSED => '已关闭',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::PENDING => 'warning',
            self::CONFIRMED => 'info',
            self::IN_PROGRESS => 'primary',
            self::COMPLETED => 'success',
            self::CANCELLED => 'secondary',
            self::NO_SHOW => 'danger',
            self::CLOSED => 'gray',
        };
    }
}
