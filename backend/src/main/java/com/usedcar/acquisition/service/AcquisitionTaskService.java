package com.usedcar.acquisition.service;

import com.usedcar.acquisition.common.PageResult;
import com.usedcar.acquisition.dto.*;
import com.usedcar.acquisition.vo.TaskDetailVO;
import com.usedcar.acquisition.vo.TaskListVO;

import java.util.List;
import java.util.Map;

public interface AcquisitionTaskService {

    Long createTask(TaskCreateDTO dto);

    PageResult<TaskListVO> queryTaskPage(TaskQueryDTO dto);

    TaskDetailVO getTaskDetail(Long taskId);

    void startAssess(Long taskId, Long operatorId, String remark);

    void addQuote(QuoteAddDTO dto);

    void flagMissingMaterial(MissingMaterialDTO dto);

    void submitSupplement(Long taskId, Long operatorId, String remark);

    void escalate(EscalateDTO dto);

    void confirmDeal(Long taskId, BigDecimal finalPrice, Long operatorId, String remark);

    void closeTask(CloseTaskDTO dto);

    void cancelTask(Long taskId, Long operatorId, String reason);

    void uploadMaterial(MaterialUploadDTO dto);

    void verifyMaterial(Long materialId, Long operatorId);

    Map<String, Object> getStatistics(String startTime, String endTime);

    List<Map<String, Object>> getSourceStats(String startTime, String endTime);

    List<Map<String, Object>> getSalesStats(String startTime, String endTime);

    List<Map<String, Object>> getCloseTypeStats(String startTime, String endTime);
}
