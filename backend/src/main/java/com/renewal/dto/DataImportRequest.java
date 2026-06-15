package com.renewal.dto;

import lombok.Data;

import java.util.List;

@Data
public class DataImportRequest {

    private String source;
    private String batchId;
    private List<RawStudentRecord> records;

    @Data
    public static class RawStudentRecord {
        private String studentName;
        private String phone;
        private String parentName;
        private String parentPhone;
        private String grade;
        private String school;
        private String sourceId;
        private String courseName;
        private String enrollDate;
        private String expireDate;
        private Integer currentChapter;
        private Integer totalChapters;
        private String completionRate;
    }
}
