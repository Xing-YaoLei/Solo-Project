package com.secondhand.funnel.dto;

import com.secondhand.funnel.enums.UserRole;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ShareLinkCreateDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotNull(message = "创建人ID不能为空")
    private Long createdBy;

    private List<UserRole> roleScope;

    @NotNull(message = "过期时间不能为空")
    private LocalDateTime expireAt;

    private Boolean includeSensitive = false;
}
