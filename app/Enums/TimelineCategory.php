<?php

namespace App\Enums;

enum TimelineCategory: int
{
    case STATUS_CHANGE = 1;
    case FIELD_CHANGE = 2;
    case NOTE = 3;
    case ATTACHMENT = 4;
    case ASSIGNMENT = 5;
    case RESPONSIBILITY = 6;
    case REVIEW = 7;
    case CUSTOMER = 8;
    case SYSTEM = 9;

    public function label(): string
    {
        return match($this) {
            self::STATUS_CHANGE => '状态变更',
            self::FIELD_CHANGE => '字段修改',
            self::NOTE => '备注记录',
            self::ATTACHMENT => '附件上传',
            self::ASSIGNMENT => '人员分配',
            self::RESPONSIBILITY => '责任调整',
            self::REVIEW => '复盘相关',
            self::CUSTOMER => '客户交互',
            self::SYSTEM => '系统操作',
        };
    }
}
