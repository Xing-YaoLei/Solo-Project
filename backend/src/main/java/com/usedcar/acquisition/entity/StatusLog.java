package com.usedcar.acquisition.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("status_log")
public class StatusLog implements Serializable {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long taskId;
    private String fromStatus;
    private String toStatus;
    private String actionType;
    private Long operatorId;
    private String operatorName;
    private Long targetUserId;
    private String actionRemark;
    private LocalDateTime actionTime;
    @TableLogic
    private Integer deleted;
    private LocalDateTime createTime;
}
