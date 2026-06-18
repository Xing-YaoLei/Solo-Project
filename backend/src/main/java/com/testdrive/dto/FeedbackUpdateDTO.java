package com.testdrive.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FeedbackUpdateDTO {

    @NotNull
    private Long feedbackId;

    private String satisfaction;
    private String customerOpinion;
    private String purchaseIntention;
    private String internalNote;

    @NotNull
    private String operator;
}
