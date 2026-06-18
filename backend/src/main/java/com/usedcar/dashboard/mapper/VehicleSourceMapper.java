package com.usedcar.dashboard.mapper;

import com.usedcar.dashboard.dto.DashboardFilter;
import com.usedcar.dashboard.entity.VehicleSource;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface VehicleSourceMapper {

    List<VehicleSource> selectByFilter(@Param("filter") DashboardFilter filter);

    VehicleSource selectById(@Param("id") Long id);

    VehicleSource selectByVehicleId(@Param("vehicleId") String vehicleId);

    List<VehicleSource> selectByStoreId(@Param("storeId") String storeId);

    Integer countListedByDateRange(@Param("startDate") LocalDateTime startDate,
                                   @Param("endDate") LocalDateTime endDate,
                                   @Param("storeIds") List<String> storeIds);

    Integer countSoldByDateRange(@Param("startDate") LocalDateTime startDate,
                                 @Param("endDate") LocalDateTime endDate,
                                 @Param("storeIds") List<String> storeIds);

    Integer countCurrentlyListed(@Param("storeIds") List<String> storeIds);

    Integer countCurrentlyListedByFilter(@Param("filter") DashboardFilter filter);

    Integer countDelistedByDateRange(@Param("startDate") LocalDateTime startDate,
                                     @Param("endDate") LocalDateTime endDate,
                                     @Param("storeIds") List<String> storeIds);

    Integer countFastMoving(@Param("filter") DashboardFilter filter);

    Integer countSlowMoving(@Param("filter") DashboardFilter filter);

    Integer insert(VehicleSource vehicleSource);

    Integer update(VehicleSource vehicleSource);

    Integer deleteById(@Param("id") Long id);
}
