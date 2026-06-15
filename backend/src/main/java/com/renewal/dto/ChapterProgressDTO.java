package com.renewal.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ChapterProgressDTO {

    private Long courseId;
    private String courseName;
    private Integer totalChapters;
    private List<ChapterProgressItem> students;

    @Data
    public static class ChapterProgressItem {
        private Long enrollmentId;
        private String studentName;
        private Integer currentChapter;
        private BigDecimal completionRate;
        private String stage;
        private Integer daysToExpire;
    }
}
