package com.usedcar.acquisition.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("quote_history")
public class QuoteHistory implements Serializable {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long taskId;
    private Integer quoteRound;
    private String quoteType;
    private BigDecimal quotePrice;
    private Long quoteBy;
    private String customerResponse;
    private BigDecimal customerCounterPrice;
    private LocalDateTime quoteTime;
    private String remark;
    @TableLogic
    private Integer deleted;
    private LocalDateTime createTime;
}
