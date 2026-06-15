package com.youth.training.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum CommonStatus {
    ACTIVE("ACTIVE", "有效"),
    INACTIVE("INACTIVE", "无效"),
    DELETED("DELETED", "已删除");

    private final String code;
    private final String desc;
}
