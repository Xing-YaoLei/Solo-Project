package com.usedcar.acquisition.dto;

import lombok.Data;
import java.io.Serializable;
import java.util.List;

@Data
public class MissingMaterialDTO implements Serializable {
    private Long taskId;
    private Long operatorId;
    private List<String> missingMaterials;
    private String remark;
}
