package com.youth.training.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum BusinessType {
    LEARNING_PROGRESS("LEARNING_PROGRESS", "学习进度"),
    RENEWAL_FOLLOW("RENEWAL_FOLLOW", "续费跟进"),
    EXCEPTION_ORDER("EXCEPTION_ORDER", "异常单"),
    SCORE_FEEDBACK("SCORE_FEEDBACK", "成绩反馈"),
    STUDENT("STUDENT", "学生"),
    HOMEWORK("HOMEWORK", "作业");

    private final String code;
    private final String desc;
}
