package com.usedcar.acquisition.enums;

import lombok.Getter;

@Getter
public enum SourceTypeEnum {
    WALK_IN("WALK_IN", "到店客户"),
    ONLINE("ONLINE", "线上平台"),
    REFERRAL("REFERRAL", "转介绍"),
    AUCTION("AUCTION", "拍卖"),
    OTHER("OTHER", "其他");

    private final String code;
    private final String desc;

    SourceTypeEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static String getDesc(String code) {
        for (SourceTypeEnum e : values()) {
            if (e.getCode().equals(code)) return e.getDesc();
        }
        return code;
    }
}
