package com.usedcar.acquisition.common;

import lombok.Data;
import java.io.Serializable;

@Data
public class PageQuery implements Serializable {
    private Integer pageNum = 1;
    private Integer pageSize = 20;
    private String keyword;
    private String orderBy = "create_time";
    private String orderType = "desc";
}
