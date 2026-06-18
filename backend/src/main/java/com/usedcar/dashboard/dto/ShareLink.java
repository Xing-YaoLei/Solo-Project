package com.usedcar.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShareLink implements Serializable {

    private static final long serialVersionUID = 1L;

    private String token;
    private String url;
    private String expiresAt;
    private List<String> permissions;
    private Boolean includesTurnoverMetrics;
}
