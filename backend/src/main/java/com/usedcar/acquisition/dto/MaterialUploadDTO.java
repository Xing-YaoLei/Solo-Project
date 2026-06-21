package com.usedcar.acquisition.dto;

import lombok.Data;
import java.io.Serializable;

@Data
public class MaterialUploadDTO implements Serializable {
    private Long taskId;
    private String materialType;
    private String materialName;
    private String fileUrl;
    private Long fileSize;
    private Integer isOriginal;
    private Long uploadBy;
    private String remark;
}
