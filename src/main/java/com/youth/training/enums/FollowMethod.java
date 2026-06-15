package com.youth.training.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum FollowMethod {
    PHONE("PHONE", "电话"),
    WECHAT("WECHAT", "微信"),
    VISIT("VISIT", "家访"),
    MEETING("MEETING", "家长会"),
    ONLINE("ONLINE", "线上沟通");

    private final String code;
    private final String desc;
}
