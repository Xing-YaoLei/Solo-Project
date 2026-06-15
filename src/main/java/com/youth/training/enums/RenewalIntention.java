package com.youth.training.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum RenewalIntention {
    HIGH("HIGH", "高意向"),
    MEDIUM("MEDIUM", "中意向"),
    LOW("LOW", "低意向"),
    NONE("NONE", "无意向"),
    UNKNOWN("UNKNOWN", "未知");

    private final String code;
    private final String desc;
}
