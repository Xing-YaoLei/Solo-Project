package com.usedcar.dashboard.mapper;

import com.usedcar.dashboard.dto.DashboardFilter;
import com.usedcar.dashboard.entity.TestDrive;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface TestDriveMapper {

    TestDrive selectById(@Param("id") Long id);

    TestDrive selectByDriveId(@Param("driveId") String driveId);

    List<TestDrive> selectByVehicleId(@Param("vehicleId") String vehicleId);

    List<TestDrive> selectByFilter(@Param("filter") DashboardFilter filter);

    List<TestDrive> selectAbnormalByDateRange(@Param("startDate") LocalDateTime startDate,
                                              @Param("endDate") LocalDateTime endDate,
                                              @Param("storeIds") List<String> storeIds);

    Integer countByDateRange(@Param("startDate") LocalDateTime startDate,
                             @Param("endDate") LocalDateTime endDate,
                             @Param("storeIds") List<String> storeIds);

    Integer countAbnormalByDateRange(@Param("startDate") LocalDateTime startDate,
                                     @Param("endDate") LocalDateTime endDate,
                                     @Param("storeIds") List<String> storeIds);

    Integer countAbnormalByFilter(@Param("filter") DashboardFilter filter);

    Integer countByFilter(@Param("filter") DashboardFilter filter);

    List<TestDrive> selectAbnormalTopN(@Param("filter") DashboardFilter filter,
                                       @Param("limit") Integer limit);

    List<TestDrive> selectDailyDistributionByFilter(@Param("filter") DashboardFilter filter);

    int insert(TestDrive testDrive);

    int update(TestDrive testDrive);

    int deleteById(@Param("id") Long id);
}
