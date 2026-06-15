package com.trial.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

public class AppointmentDTO {

    @Data
    public static class CreateRequest {
        @NotBlank(message = "学生姓名不能为空")
        private String studentName;

        private String studentPhone;

        @NotBlank(message = "科目不能为空")
        private String subject;

        @NotNull(message = "试听日期不能为空")
        private LocalDate trialDate;

        @NotBlank(message = "时段不能为空")
        private String timeSlot;

        @NotNull(message = "老师不能为空")
        private Long teacherId;

        @NotBlank(message = "校区不能为空")
        private String campus;

        private String remark;

        private Long parentId;

        private Long studentUserId;
    }

    @Data
    public static class UpdateRequest {
        private String studentName;

        private String studentPhone;

        private String subject;

        private LocalDate trialDate;

        private String timeSlot;

        private Long teacherId;

        private String campus;

        private String status;

        private String remark;
    }

    @Data
    public static class RescheduleRequest {
        @NotNull(message = "试听日期不能为空")
        private LocalDate trialDate;

        @NotBlank(message = "时段不能为空")
        private String timeSlot;

        private Long teacherId;

        private String reason;
    }

    @Data
    public static class SearchParams {
        private int page = 1;
        private int pageSize = 20;
        private LocalDate startDate;
        private LocalDate endDate;
        private LocalDate trialDate;
        private String campus;
        private String subject;
        private String status;
        private String attendanceStatus;
        private Long teacherId;
        private String keyword;
    }

    @Data
    public static class BatchStatusRequest {
        @NotNull(message = "ID列表不能为空")
        private List<Long> ids;

        @NotBlank(message = "状态不能为空")
        private String status;

        private String reason;
    }

    @Data
    public static class BatchIdsRequest {
        @NotNull(message = "ID列表不能为空")
        private List<Long> ids;

        private String reason;
    }

    @Data
    public static class ConflictParams {
        private Long teacherId;

        @NotNull(message = "日期不能为空")
        private LocalDate date;

        private String timeSlot;

        private Long excludeId;
    }

    @Data
    public static class AllConflictsParams {
        @NotNull(message = "日期不能为空")
        private LocalDate date;

        private Long teacherId;
    }

    @Data
    public static class ChangeLogSearchParams {
        private int page = 1;
        private int pageSize = 20;
        private String changeType;
    }
}
