package com.usedcar.dashboard.mapper;

import com.usedcar.dashboard.dto.DashboardFilter;
import com.usedcar.dashboard.entity.InventoryDailySnapshot;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface InventoryDailySnapshotMapper {

    InventoryDailySnapshot selectById(@Param("id") Long id);

    InventoryDailySnapshot selectByDateAndStore(@Param("snapshotDate") LocalDate snapshotDate,
                                                @Param("storeId") String storeId);

    List<InventoryDailySnapshot> selectByDateRange(@Param("startDate") LocalDate startDate,
                                                   @Param("endDate") LocalDate endDate,
                                                   @Param("storeIds") List<String> storeIds);

    List<InventoryDailySnapshot> selectByStoreId(@Param("storeId") String storeId,
                                                 @Param("limit") Integer limit);

    Double avgTurnoverDaysByFilter(@Param("filter") DashboardFilter filter);

    int insert(InventoryDailySnapshot snapshot);

    int update(InventoryDailySnapshot snapshot);

    int deleteById(@Param("id") Long id);
}
