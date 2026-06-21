package com.usedcar.acquisition.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.usedcar.acquisition.entity.Inventory;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Mapper
public interface InventoryMapper extends BaseMapper<Inventory> {

    @Select("SELECT " +
            "COUNT(*) as totalInStock, " +
            "ROUND(AVG(days_in_stock), 1) as avgDays, " +
            "SUM(CASE WHEN days_in_stock <= 7 THEN 1 ELSE 0 END) as fastTurnover, " +
            "SUM(CASE WHEN days_in_stock > 7 AND days_in_stock <= 30 THEN 1 ELSE 0 END) as normalTurnover, " +
            "SUM(CASE WHEN days_in_stock > 30 THEN 1 ELSE 0 END) as slowTurnover, " +
            "SUM(purchase_price) as totalCost, " +
            "SUM(expected_sale_price - purchase_price) as totalProfit " +
            "FROM inventory WHERE deleted = 0 AND inventory_status = 'IN_STOCK'")
    Map<String, Object> getInventoryTurnoverStats();

    @Select("SELECT i.*, v.brand, v.series, v.model, v.plate_no, v.color, v.register_date " +
            "FROM inventory i LEFT JOIN vehicle_archive v ON i.vehicle_id = v.id " +
            "WHERE i.deleted = 0 AND i.inventory_status = 'IN_STOCK' " +
            "AND (#{startDate} IS NULL OR i.inbound_date >= #{startDate}) " +
            "AND (#{endDate} IS NULL OR i.inbound_date <= #{endDate}) " +
            "ORDER BY i.days_in_stock DESC")
    List<Map<String, Object>> getInventoryListWithVehicle(@Param("startDate") LocalDate startDate,
                                                          @Param("endDate") LocalDate endDate);
}
