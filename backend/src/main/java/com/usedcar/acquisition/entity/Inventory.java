package com.usedcar.acquisition.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("inventory")
public class Inventory implements Serializable {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long taskId;
    private Long vehicleId;
    private BigDecimal purchasePrice;
    private LocalDate inboundDate;
    private BigDecimal expectedSalePrice;
    private String warehouseLocation;
    private String inventoryStatus;
    private Integer daysInStock;
    private LocalDate lastCountDate;
    private LocalDate outboundDate;
    private BigDecimal salePrice;
    @TableLogic
    private Integer deleted;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
