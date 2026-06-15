package com.youth.training.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ProgressType {
    COURSE("COURSE", "课程进度"),
    CHAPTER("CHAPTER", "章节进度"),
    HOMEWORK("HOMEWORK", "作业进度");

    private final String code;
    private final String desc;
}
