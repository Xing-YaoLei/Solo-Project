package com.secondhand.funnel.dto;

import com.secondhand.funnel.enums.UserRole;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

@Data
public class ShareLinkCreateDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotBlank(message = "链接名称不能为空")
    private String title;

    private String dataType = "funnel";

    private List<UserRole> roleScope;

    private Integer validDays = 7;

    private Boolean includeSensitive = false;

    private String password;

    private Long createdBy = 1L;
}
