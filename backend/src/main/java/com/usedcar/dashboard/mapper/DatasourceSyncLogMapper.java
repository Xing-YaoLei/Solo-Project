package com.usedcar.dashboard.mapper;

import com.usedcar.dashboard.entity.DatasourceSyncLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface DatasourceSyncLogMapper {

    DatasourceSyncLog selectById(@Param("id") Long id);

    List<DatasourceSyncLog> selectBySourceName(@Param("sourceName") String sourceName,
                                               @Param("limit") Integer limit);

    List<DatasourceSyncLog> selectLatestPerSource();

    List<DatasourceSyncLog> selectByDateRange(@Param("startTime") LocalDateTime startTime,
                                              @Param("endTime") LocalDateTime endTime);

    int insert(DatasourceSyncLog log);

    int update(DatasourceSyncLog log);

    int deleteById(@Param("id") Long id);
}
