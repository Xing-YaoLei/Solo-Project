package com.youth.training.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum FollowStage {
    EARLY("EARLY", "前期提醒"),
    MIDDLE("MIDDLE", "中期跟进"),
    LATE("LATE", "后期冲刺"),
    EXPIRED("EXPIRED", "过期跟进");

    private final String code;
    private final String desc;
}
