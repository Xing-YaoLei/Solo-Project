package com.usedcar.acquisition.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("finance_material")
public class FinanceMaterial implements Serializable {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long taskId;
    private String materialType;
    private String materialName;
    private String fileUrl;
    private Long fileSize;
    private Integer isOriginal;
    private Integer isVerified;
    private Long verifyBy;
    private LocalDateTime verifyTime;
    private Integer isMissing;
    private String missingRemark;
    private Long uploadBy;
    private LocalDateTime uploadTime;
    private String remark;
    @TableLogic
    private Integer deleted;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
