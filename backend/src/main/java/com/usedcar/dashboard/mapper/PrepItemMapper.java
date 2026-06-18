package com.usedcar.dashboard.mapper;

import com.usedcar.dashboard.dto.DashboardFilter;
import com.usedcar.dashboard.entity.PrepItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface PrepItemMapper {

    PrepItem selectById(@Param("id") Long id);

    List<PrepItem> selectByVehicleId(@Param("vehicleId") String vehicleId);

    List<PrepItem> selectByFilter(@Param("filter") DashboardFilter filter);

    List<PrepItem> selectByStatus(@Param("status") String status,
                                  @Param("storeIds") List<String> storeIds);

    List<PrepItem> selectOverdueItems(@Param("storeIds") List<String> storeIds);

    Integer countByStatus(@Param("status") String status,
                          @Param("storeIds") List<String> storeIds);

    Integer countOverdue(@Param("storeIds") List<String> storeIds);

    Double calcAvgPrepDaysByFilter(@Param("filter") DashboardFilter filter);

    List<PrepItem> selectOverdueItemsTopN(@Param("filter") DashboardFilter filter,
                                          @Param("limit") Integer limit);

    Integer countByStatusAndFilter(@Param("status") String status,
                                   @Param("filter") DashboardFilter filter);

    int insert(PrepItem item);

    int update(PrepItem item);

    int deleteById(@Param("id") Long id);
}
