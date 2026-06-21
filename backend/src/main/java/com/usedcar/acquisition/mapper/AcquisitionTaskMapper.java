package com.usedcar.acquisition.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.usedcar.acquisition.entity.AcquisitionTask;
import com.usedcar.acquisition.vo.TaskSummaryVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Mapper
public interface AcquisitionTaskMapper extends BaseMapper<AcquisitionTask> {

    @Select("SELECT source_type as sourceType, COUNT(*) as count, " +
            "SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as closedCount, " +
            "SUM(CASE WHEN close_type = 'NORMAL' THEN 1 ELSE 0 END) as successCount " +
            "FROM acquisition_task WHERE deleted = 0 " +
            "AND (#{startTime} IS NULL OR create_time >= #{startTime}) " +
            "AND (#{endTime} IS NULL OR create_time <= #{endTime}) " +
            "GROUP BY source_type ORDER BY count DESC")
    List<Map<String, Object>> countBySourceType(@Param("startTime") LocalDateTime startTime,
                                                 @Param("endTime") LocalDateTime endTime);

    @Select("SELECT u.real_name as name, COUNT(*) as total, " +
            "SUM(CASE WHEN t.close_type = 'NORMAL' THEN 1 ELSE 0 END) as success, " +
            "ROUND(SUM(CASE WHEN t.close_type = 'NORMAL' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as rate " +
            "FROM acquisition_task t LEFT JOIN sys_user u ON t.sales_id = u.id " +
            "WHERE t.deleted = 0 AND t.sales_id IS NOT NULL " +
            "AND (#{startTime} IS NULL OR t.create_time >= #{startTime}) " +
            "AND (#{endTime} IS NULL OR t.create_time <= #{endTime}) " +
            "GROUP BY t.sales_id, u.real_name ORDER BY total DESC")
    List<Map<String, Object>> countBySales(@Param("startTime") LocalDateTime startTime,
                                            @Param("endTime") LocalDateTime endTime);

    @Select("SELECT close_type as closeType, COUNT(*) as count " +
            "FROM acquisition_task WHERE deleted = 0 AND is_active = 0 " +
            "AND (#{startTime} IS NULL OR close_time >= #{startTime}) " +
            "AND (#{endTime} IS NULL OR close_time <= #{endTime}) " +
            "GROUP BY close_type ORDER BY count DESC")
    List<Map<String, Object>> countByCloseType(@Param("startTime") LocalDateTime startTime,
                                                @Param("endTime") LocalDateTime endTime);

    @Select("SELECT " +
            "COUNT(*) as totalTasks, " +
            "SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as activeTasks, " +
            "SUM(CASE WHEN is_active = 0 AND close_type = 'NORMAL' THEN 1 ELSE 0 END) as successTasks, " +
            "SUM(CASE WHEN task_status = 'MATERIAL_MISSING' THEN 1 ELSE 0 END) as missingTasks, " +
            "SUM(CASE WHEN task_status = 'ESCALATED' THEN 1 ELSE 0 END) as escalatedTasks " +
            "FROM acquisition_task WHERE deleted = 0 " +
            "AND (#{startTime} IS NULL OR create_time >= #{startTime}) " +
            "AND (#{endTime} IS NULL OR create_time <= #{endTime})")
    Map<String, Object> getOverviewStats(@Param("startTime") LocalDateTime startTime,
                                         @Param("endTime") LocalDateTime endTime);
}
