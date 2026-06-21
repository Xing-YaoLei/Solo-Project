package com.usedcar.acquisition.dto;

import lombok.Data;
import java.io.Serializable;

@Data
public class EscalateDTO implements Serializable {
    private Long taskId;
    private Long operatorId;
    private String reason;
    private String targetRole;
    private Long targetUserId;
}
