package com.usedcar.acquisition.enums;

import lombok.Getter;

@Getter
public enum ActionTypeEnum {
    CREATE("CREATE", "创建任务"),
    ASSESS("ASSESS", "开始评估"),
    QUOTE("QUOTE", "发起报价"),
    FLAG_MISSING("FLAG_MISSING", "标记资料缺失"),
    SUPPLEMENT("SUPPLEMENT", "提交补充材料"),
    ESCALATE("ESCALATE", "升级处理"),
    APPROVE("APPROVE", "审批"),
    DEAL("DEAL", "确认成交"),
    NORMAL_CLOSE("NORMAL_CLOSE", "正常关闭"),
    REJECT_CLOSE("REJECT_CLOSE", "放弃关闭"),
    CANCEL("CANCEL", "取消任务"),
    REASSIGN("REASSIGN", "改派任务");

    private final String code;
    private final String desc;

    ActionTypeEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}
