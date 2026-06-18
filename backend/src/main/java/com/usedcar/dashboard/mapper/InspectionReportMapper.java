package com.usedcar.dashboard.mapper;

import com.usedcar.dashboard.dto.DashboardFilter;
import com.usedcar.dashboard.entity.InspectionReport;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface InspectionReportMapper {

    InspectionReport selectById(@Param("id") Long id);

    InspectionReport selectByReportId(@Param("reportId") String reportId);

    List<InspectionReport> selectByVehicleId(@Param("vehicleId") String vehicleId);

    List<InspectionReport> selectByFilter(@Param("filter") DashboardFilter filter);

    List<InspectionReport> selectByDateRange(@Param("startDate") LocalDateTime startDate,
                                             @Param("endDate") LocalDateTime endDate,
                                             @Param("storeIds") List<String> storeIds);

    Integer countDefectiveByDateRange(@Param("startDate") LocalDateTime startDate,
                                      @Param("endDate") LocalDateTime endDate,
                                      @Param("storeIds") List<String> storeIds);

    Double countPassRateByFilter(@Param("filter") DashboardFilter filter);

    List<InspectionReport> selectCategoryGroupByFilter(@Param("filter") DashboardFilter filter);

    int insert(InspectionReport report);

    int update(InspectionReport report);

    int deleteById(@Param("id") Long id);
}
