package com.youth.training.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ExceptionType {
    PROGRESS_DELAY("PROGRESS_DELAY", "进度落后"),
    SCORE_DROP("SCORE_DROP", "成绩下滑"),
    HOMEWORK_UNSUBMITTED("HOMEWORK_UNSUBMITTED", "未交作业"),
    RENEWAL_RISK("RENEWAL_RISK", "续费风险"),
    ATTENDANCE_ABSENT("ATTENDANCE_ABSENT", "缺勤");

    private final String code;
    private final String desc;
}
