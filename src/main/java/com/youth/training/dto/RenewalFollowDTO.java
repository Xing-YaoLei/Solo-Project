package com.youth.training.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RenewalFollowDTO {

    private Long studentId;

    private String followStage;

    private String followTheme;

    private String followContent;

    private String followMethod;

    private LocalDate planDate;

    private LocalDate actualDate;

    private String followPerson;

    private String studentFeedback;

    private String parentFeedback;

    private String renewalIntention;

    private String renewalStatus;

    private String nextStep;

    private LocalDate nextFollowDate;

    private String status;

    private String remark;
}
