package com.usedcar.acquisition.enums;

import lombok.Getter;

@Getter
public enum TaskStatusEnum {
    PENDING("PENDING", "待录入"),
    ASSESSING("ASSESSING", "评估中"),
    QUOTING("QUOTING", "报价中"),
    MATERIAL_MISSING("MATERIAL_MISSING", "资料缺失"),
    SUPPLEMENTING("SUPPLEMENTING", "补充材料中"),
    ESCALATED("ESCALATED", "升级处理中"),
    APPROVING("APPROVING", "审批中"),
    DEALING("DEALING", "成交待入库"),
    NORMAL_CLOSED("NORMAL_CLOSED", "正常关闭(收购成功)"),
    REJECT_CLOSED("REJECT_CLOSED", "放弃关闭"),
    CANCELLED("CANCELLED", "已取消");

    private final String code;
    private final String desc;

    TaskStatusEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static String getDesc(String code) {
        for (TaskStatusEnum e : values()) {
            if (e.getCode().equals(code)) return e.getDesc();
        }
        return code;
    }

    public boolean isClosed() {
        return this == NORMAL_CLOSED || this == REJECT_CLOSED || this == CANCELLED;
    }
}
