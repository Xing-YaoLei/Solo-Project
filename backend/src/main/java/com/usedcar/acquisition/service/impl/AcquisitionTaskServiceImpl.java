package com.usedcar.acquisition.service.impl;

import cn.hutool.core.date.DateUtil;
import cn.hutool.core.util.StrUtil;
import com.alibaba.fastjson2.JSON;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.usedcar.acquisition.common.PageResult;
import com.usedcar.acquisition.dto.*;
import com.usedcar.acquisition.entity.*;
import com.usedcar.acquisition.enums.ActionTypeEnum;
import com.usedcar.acquisition.enums.SourceTypeEnum;
import com.usedcar.acquisition.enums.TaskStatusEnum;
import com.usedcar.acquisition.exception.BusinessException;
import com.usedcar.acquisition.mapper.*;
import com.usedcar.acquisition.service.AcquisitionTaskService;
import com.usedcar.acquisition.vo.TaskDetailVO;
import com.usedcar.acquisition.vo.TaskListVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AcquisitionTaskServiceImpl implements AcquisitionTaskService {

    private final AcquisitionTaskMapper taskMapper;
    private final VehicleArchiveMapper vehicleMapper;
    private final QuoteHistoryMapper quoteMapper;
    private final FinanceMaterialMapper materialMapper;
    private final StatusLogMapper statusLogMapper;
    private final SysUserMapper userMapper;
    private final InventoryMapper inventoryMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String TASK_NO_CACHE_KEY = "acq:task_no_seq:";
    private static final String TASK_DETAIL_CACHE_KEY = "acq:task_detail:";

    private Map<Long, String> loadUserNames(Collection<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) return Collections.emptyMap();
        List<Long> ids = userIds.stream().filter(Objects::nonNull).distinct().toList();
        if (ids.isEmpty()) return Collections.emptyMap();
        List<SysUser> users = userMapper.selectBatchIds(ids);
        return users.stream().collect(Collectors.toMap(SysUser::getId, SysUser::getRealName, (a, b) -> a));
    }

    private String generateTaskNo() {
        String datePart = DateUtil.format(new Date(), "yyyyMM");
        String cacheKey = TASK_NO_CACHE_KEY + datePart;
        Long seq = redisTemplate.opsForValue().increment(cacheKey);
        if (seq == 1) {
            redisTemplate.expire(cacheKey, 35, TimeUnit.DAYS);
        }
        return String.format("ACQ%s%03d", datePart, seq);
    }

    private void writeStatusLog(Long taskId, String fromStatus, String toStatus,
                                String actionType, Long operatorId, String actionRemark, Long targetUserId) {
        StatusLog log = new StatusLog();
        log.setTaskId(taskId);
        log.setFromStatus(fromStatus);
        log.setToStatus(toStatus);
        log.setActionType(actionType);
        log.setOperatorId(operatorId);
        if (operatorId != null) {
            SysUser u = userMapper.selectById(operatorId);
            if (u != null) log.setOperatorName(u.getRealName());
        }
        log.setTargetUserId(targetUserId);
        log.setActionRemark(actionRemark);
        log.setActionTime(LocalDateTime.now());
        statusLogMapper.insert(log);
    }

    private AcquisitionTask getTaskOrThrow(Long taskId) {
        AcquisitionTask task = taskMapper.selectById(taskId);
        if (task == null) throw new BusinessException("任务单不存在");
        return task;
    }

    private void checkTaskNotClosed(AcquisitionTask task) {
        if (TaskStatusEnum.valueOf(task.getTaskStatus()).isClosed()) {
            throw new BusinessException("任务单已关闭，不可操作");
        }
    }

    private void updateTaskStatus(AcquisitionTask task, String newStatus, Long operatorId,
                                  String actionType, String remark, Long targetUserId) {
        String oldStatus = task.getTaskStatus();
        task.setTaskStatus(newStatus);
        task.setUpdateTime(LocalDateTime.now());
        taskMapper.updateById(task);
        writeStatusLog(task.getId(), oldStatus, newStatus, actionType, operatorId, remark, targetUserId);
        redisTemplate.delete(TASK_DETAIL_CACHE_KEY + task.getId());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createTask(TaskCreateDTO dto) {
        VehicleArchive vehicle = new VehicleArchive();
        if (StrUtil.isNotBlank(dto.getVin())) {
            VehicleArchive existing = vehicleMapper.selectOne(
                    new LambdaQueryWrapper<VehicleArchive>().eq(VehicleArchive::getVin, dto.getVin()));
            if (existing != null) {
                vehicle = existing;
            }
        }
        vehicle.setVin(dto.getVin());
        vehicle.setPlateNo(dto.getPlateNo());
        vehicle.setBrand(dto.getBrand());
        vehicle.setSeries(dto.getSeries());
        vehicle.setModel(dto.getModel());
        vehicle.setColor(dto.getColor());
        if (StrUtil.isNotBlank(dto.getRegisterDate())) {
            vehicle.setRegisterDate(LocalDate.parse(dto.getRegisterDate()));
        }
        vehicle.setMileage(dto.getMileage());
        vehicle.setEmissionStandard(dto.getEmissionStandard());
        vehicle.setTransmission(dto.getTransmission());
        vehicle.setDisplacement(dto.getDisplacement());
        vehicle.setFuelType(dto.getFuelType());
        vehicle.setBodyType(dto.getBodyType());
        vehicle.setOwnerName(dto.getOwnerName());
        vehicle.setOwnerPhone(dto.getOwnerPhone());
        vehicle.setRemark(dto.getRemark());
        if (vehicle.getId() == null) {
            vehicleMapper.insert(vehicle);
        } else {
            vehicleMapper.updateById(vehicle);
        }

        AcquisitionTask task = new AcquisitionTask();
        task.setTaskNo(generateTaskNo());
        task.setVehicleId(vehicle.getId());
        task.setSourceType(dto.getSourceType());
        task.setSourceDetail(dto.getSourceDetail());
        task.setCustomerName(dto.getCustomerName());
        task.setCustomerPhone(dto.getCustomerPhone());
        task.setAssessorId(dto.getAssessorId());
        task.setSalesId(dto.getSalesId());
        task.setManagerId(dto.getManagerId());
        task.setExpectedPrice(dto.getExpectedPrice());
        task.setVehicleStatus(StrUtil.isNotBlank(dto.getVehicleStatus()) ? dto.getVehicleStatus() : "NORMAL");
        task.setTaskStatus(TaskStatusEnum.PENDING.getCode());
        task.setIsActive(1);
        task.setCreateBy(dto.getCreateBy());
        taskMapper.insert(task);

        writeStatusLog(task.getId(), null, TaskStatusEnum.PENDING.getCode(),
                ActionTypeEnum.CREATE.getCode(), dto.getCreateBy(), "创建收购任务", null);

        return task.getId();
    }

    @Override
    public PageResult<TaskListVO> queryTaskPage(TaskQueryDTO dto) {
        LambdaQueryWrapper<AcquisitionTask> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StrUtil.isNotBlank(dto.getTaskNo()), AcquisitionTask::getTaskNo, dto.getTaskNo())
                .eq(StrUtil.isNotBlank(dto.getTaskStatus()), AcquisitionTask::getTaskStatus, dto.getTaskStatus())
                .eq(StrUtil.isNotBlank(dto.getSourceType()), AcquisitionTask::getSourceType, dto.getSourceType())
                .like(StrUtil.isNotBlank(dto.getCustomerName()), AcquisitionTask::getCustomerName, dto.getCustomerName())
                .like(StrUtil.isNotBlank(dto.getCustomerPhone()), AcquisitionTask::getCustomerPhone, dto.getCustomerPhone())
                .eq(dto.getAssessorId() != null, AcquisitionTask::getAssessorId, dto.getAssessorId())
                .eq(dto.getSalesId() != null, AcquisitionTask::getSalesId, dto.getSalesId())
                .eq(dto.getManagerId() != null, AcquisitionTask::getManagerId, dto.getManagerId())
                .eq(dto.getIsActive() != null, AcquisitionTask::getIsActive, dto.getIsActive())
                .ge(dto.getStartTime() != null, AcquisitionTask::getCreateTime, dto.getStartTime())
                .le(dto.getEndTime() != null, AcquisitionTask::getCreateTime, dto.getEndTime());

        if (StrUtil.isNotBlank(dto.getKeyword())) {
            wrapper.and(w -> w.like(AcquisitionTask::getTaskNo, dto.getKeyword())
                    .or().like(AcquisitionTask::getCustomerName, dto.getKeyword()));
        }
        if (StrUtil.isNotBlank(dto.getOrderBy())) {
            boolean asc = "asc".equalsIgnoreCase(dto.getOrderType());
            if (asc) wrapper.orderByAsc(AcquisitionTask::getCreateTime);
            else wrapper.orderByDesc(AcquisitionTask::getCreateTime);
        } else {
            wrapper.orderByDesc(AcquisitionTask::getCreateTime);
        }

        IPage<AcquisitionTask> page = taskMapper.selectPage(
                new Page<>(dto.getPageNum(), dto.getPageSize()), wrapper);

        List<AcquisitionTask> tasks = page.getRecords();
        List<Long> vehicleIds = tasks.stream().map(AcquisitionTask::getVehicleId).distinct().toList();
        List<Long> userIds = new ArrayList<>();
        tasks.forEach(t -> {
            userIds.add(t.getAssessorId());
            userIds.add(t.getSalesId());
            userIds.add(t.getManagerId());
        });

        Map<Long, VehicleArchive> vehicleMap = vehicleIds.isEmpty() ? Collections.emptyMap() :
                vehicleMapper.selectBatchIds(vehicleIds).stream()
                        .collect(Collectors.toMap(VehicleArchive::getId, v -> v, (a, b) -> a));
        Map<Long, String> userNameMap = loadUserNames(userIds);

        List<TaskListVO> voList = tasks.stream().map(t -> {
            TaskListVO vo = new TaskListVO();
            vo.setId(t.getId());
            vo.setTaskNo(t.getTaskNo());
            vo.setVehicleId(t.getVehicleId());
            vo.setSourceType(t.getSourceType());
            vo.setSourceTypeDesc(SourceTypeEnum.getDesc(t.getSourceType()));
            vo.setCustomerName(t.getCustomerName());
            vo.setCustomerPhone(t.getCustomerPhone());
            vo.setTaskStatus(t.getTaskStatus());
            vo.setTaskStatusDesc(TaskStatusEnum.getDesc(t.getTaskStatus()));
            vo.setExpectedPrice(t.getExpectedPrice());
            vo.setFinalPrice(t.getFinalPrice());
            vo.setIsActive(t.getIsActive());
            vo.setCreateTime(t.getCreateTime());
            vo.setCloseTime(t.getCloseTime());
            vo.setAssessorId(t.getAssessorId());
            vo.setAssessorName(userNameMap.get(t.getAssessorId()));
            vo.setSalesId(t.getSalesId());
            vo.setSalesName(userNameMap.get(t.getSalesId()));
            vo.setManagerId(t.getManagerId());
            vo.setManagerName(userNameMap.get(t.getManagerId()));
            VehicleArchive v = vehicleMap.get(t.getVehicleId());
            if (v != null) {
                vo.setVehicleBrand(v.getBrand());
                vo.setVehicleSeries(v.getSeries());
                vo.setVehicleModel(v.getModel());
                vo.setPlateNo(v.getPlateNo());
                vo.setVin(v.getVin());
            }
            return vo;
        }).toList();

        return PageResult.of(voList, page.getTotal(), dto.getPageNum(), dto.getPageSize());
    }

    @Override
    public TaskDetailVO getTaskDetail(Long taskId) {
        String cacheKey = TASK_DETAIL_CACHE_KEY + taskId;
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return JSON.parseObject(JSON.toJSONString(cached), TaskDetailVO.class);
        }

        AcquisitionTask task = getTaskOrThrow(taskId);
        VehicleArchive vehicle = vehicleMapper.selectById(task.getVehicleId());
        List<QuoteHistory> quoteList = quoteMapper.selectList(
                new LambdaQueryWrapper<QuoteHistory>().eq(QuoteHistory::getTaskId, taskId)
                        .orderByAsc(QuoteHistory::getQuoteRound, QuoteHistory::getQuoteTime));
        List<FinanceMaterial> materialList = materialMapper.selectList(
                new LambdaQueryWrapper<FinanceMaterial>().eq(FinanceMaterial::getTaskId, taskId)
                        .orderByAsc(FinanceMaterial::getMaterialType));
        List<StatusLog> statusLogList = statusLogMapper.selectList(
                new LambdaQueryWrapper<StatusLog>().eq(StatusLog::getTaskId, taskId)
                        .orderByAsc(StatusLog::getActionTime));

        List<Long> userIds = Arrays.asList(task.getAssessorId(), task.getSalesId(),
                task.getManagerId(), task.getCreateBy());
        Map<Long, String> userNameMap = loadUserNames(userIds);

        TaskDetailVO vo = new TaskDetailVO();
        vo.setTask(task);
        vo.setVehicle(vehicle);
        vo.setQuoteList(quoteList);
        vo.setMaterialList(materialList);
        vo.setStatusLogList(statusLogList);
        vo.setAssessorName(userNameMap.get(task.getAssessorId()));
        vo.setSalesName(userNameMap.get(task.getSalesId()));
        vo.setManagerName(userNameMap.get(task.getManagerId()));
        vo.setCreateByName(userNameMap.get(task.getCreateBy()));

        redisTemplate.opsForValue().set(cacheKey, vo, 30, TimeUnit.MINUTES);
        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void startAssess(Long taskId, Long operatorId, String remark) {
        AcquisitionTask task = getTaskOrThrow(taskId);
        checkTaskNotClosed(task);
        updateTaskStatus(task, TaskStatusEnum.ASSESSING.getCode(), operatorId,
                ActionTypeEnum.ASSESS.getCode(), StrUtil.isNotBlank(remark) ? remark : "开始车辆评估", null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void addQuote(QuoteAddDTO dto) {
        AcquisitionTask task = getTaskOrThrow(dto.getTaskId());
        checkTaskNotClosed(task);

        Integer maxRound = quoteMapper.selectObjs(new LambdaQueryWrapper<QuoteHistory>()
                        .eq(QuoteHistory::getTaskId, dto.getTaskId())
                        .select("MAX(quote_round)")).stream()
                .findFirst().map(o -> ((Number) o).intValue()).orElse(0);

        QuoteHistory quote = new QuoteHistory();
        quote.setTaskId(dto.getTaskId());
        quote.setQuoteRound(maxRound + 1);
        quote.setQuoteType(dto.getQuoteType());
        quote.setQuotePrice(dto.getQuotePrice());
        quote.setQuoteBy(dto.getQuoteBy());
        quote.setCustomerResponse(dto.getCustomerResponse());
        quote.setCustomerCounterPrice(dto.getCustomerCounterPrice());
        quote.setQuoteTime(LocalDateTime.now());
        quote.setRemark(dto.getRemark());
        quoteMapper.insert(quote);

        if (!TaskStatusEnum.QUOTING.getCode().equals(task.getTaskStatus())) {
            updateTaskStatus(task, TaskStatusEnum.QUOTING.getCode(), dto.getQuoteBy(),
                    ActionTypeEnum.QUOTE.getCode(),
                    StrUtil.isNotBlank(dto.getRemark()) ? dto.getRemark() : "发起第" + (maxRound + 1) + "轮报价", null);
        } else {
            writeStatusLog(task.getId(), task.getTaskStatus(), task.getTaskStatus(),
                    ActionTypeEnum.QUOTE.getCode(), dto.getQuoteBy(),
                    "追加报价: " + dto.getQuotePrice() + "元", null);
            task.setUpdateTime(LocalDateTime.now());
            taskMapper.updateById(task);
            redisTemplate.delete(TASK_DETAIL_CACHE_KEY + task.getId());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void flagMissingMaterial(MissingMaterialDTO dto) {
        AcquisitionTask task = getTaskOrThrow(dto.getTaskId());
        checkTaskNotClosed(task);

        if (dto.getMissingMaterials() != null && !dto.getMissingMaterials().isEmpty()) {
            List<FinanceMaterial> existing = materialMapper.selectList(
                    new LambdaQueryWrapper<FinanceMaterial>().eq(FinanceMaterial::getTaskId, task.getId()));
            Set<String> existingTypes = existing.stream()
                    .map(FinanceMaterial::getMaterialType).collect(Collectors.toSet());

            for (String matType : dto.getMissingMaterials()) {
                if (!existingTypes.contains(matType)) {
                    FinanceMaterial mat = new FinanceMaterial();
                    mat.setTaskId(task.getId());
                    mat.setMaterialType(matType);
                    mat.setMaterialName(getMaterialNameByType(matType));
                    mat.setIsMissing(1);
                    mat.setMissingRemark(dto.getRemark());
                    materialMapper.insert(mat);
                } else {
                    for (FinanceMaterial m : existing) {
                        if (matType.equals(m.getMaterialType())) {
                            m.setIsMissing(1);
                            m.setMissingRemark(dto.getRemark());
                            materialMapper.updateById(m);
                        }
                    }
                }
            }
            task.setMissingMaterials(JSON.toJSONString(dto.getMissingMaterials()));
        }

        updateTaskStatus(task, TaskStatusEnum.MATERIAL_MISSING.getCode(), dto.getOperatorId(),
                ActionTypeEnum.FLAG_MISSING.getCode(),
                StrUtil.isNotBlank(dto.getRemark()) ? dto.getRemark() : "标记资料缺失，共" +
                        (dto.getMissingMaterials() == null ? 0 : dto.getMissingMaterials().size()) + "项", null);
    }

    private String getMaterialNameByType(String type) {
        return switch (type) {
            case "ID_CARD_OWNER" -> "车主身份证";
            case "ID_CARD_SPOUSE" -> "配偶身份证";
            case "VEHICLE_REG_CERT" -> "车辆登记证";
            case "VEHICLE_LICENSE" -> "行驶证";
            case "PURCHASE_INVOICE" -> "购车发票";
            case "INSURANCE_POLICY" -> "保险单";
            case "MAINTENANCE_RECORD" -> "保养记录";
            case "VEHICLE_PHOTO" -> "车辆照片";
            case "KEY_CERT" -> "车钥匙";
            case "LOAN_AGREEMENT" -> "贷款合同";
            default -> "其他资料";
        };
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void submitSupplement(Long taskId, Long operatorId, String remark) {
        AcquisitionTask task = getTaskOrThrow(taskId);
        checkTaskNotClosed(task);

        List<FinanceMaterial> mats = materialMapper.selectList(
                new LambdaQueryWrapper<FinanceMaterial>().eq(FinanceMaterial::getTaskId, taskId));
        long missingCount = mats.stream().filter(m -> m.getIsMissing() != null && m.getIsMissing() == 1).count();

        updateTaskStatus(task, TaskStatusEnum.SUPPLEMENTING.getCode(), operatorId,
                ActionTypeEnum.SUPPLEMENT.getCode(),
                (StrUtil.isNotBlank(remark) ? remark : "客户提交补充材料") + "，剩余缺失：" + missingCount + "项", null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void escalate(EscalateDTO dto) {
        AcquisitionTask task = getTaskOrThrow(dto.getTaskId());
        checkTaskNotClosed(task);
        task.setEscalateReason(dto.getReason());
        task.setEscalateTargetRole(dto.getTargetRole());
        taskMapper.updateById(task);
        updateTaskStatus(task, TaskStatusEnum.ESCALATED.getCode(), dto.getOperatorId(),
                ActionTypeEnum.ESCALATE.getCode(), dto.getReason(), dto.getTargetUserId());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void confirmDeal(Long taskId, BigDecimal finalPrice, Long operatorId, String remark) {
        AcquisitionTask task = getTaskOrThrow(taskId);
        checkTaskNotClosed(task);
        task.setFinalPrice(finalPrice);
        taskMapper.updateById(task);
        updateTaskStatus(task, TaskStatusEnum.DEALING.getCode(), operatorId,
                ActionTypeEnum.DEAL.getCode(),
                (StrUtil.isNotBlank(remark) ? remark : "确认成交，收购价：" + finalPrice + "元"), null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void closeTask(CloseTaskDTO dto) {
        AcquisitionTask task = getTaskOrThrow(dto.getTaskId());
        checkTaskNotClosed(task);

        task.setCloseType(dto.getCloseType());
        task.setCloseReason(dto.getCloseReason());
        task.setCloseTime(LocalDateTime.now());
        task.setIsActive(0);

        if ("NORMAL".equals(dto.getCloseType())) {
            if (dto.getFinalPrice() != null) {
                task.setFinalPrice(dto.getFinalPrice());
            }
            if (dto.getInboundDate() != null) {
                long days = ChronoUnit.DAYS.between(dto.getInboundDate(), LocalDate.now());
                task.setInventoryDays((int) Math.max(0, days));

                Inventory inv = new Inventory();
                inv.setTaskId(task.getId());
                inv.setVehicleId(task.getVehicleId());
                inv.setPurchasePrice(task.getFinalPrice());
                inv.setInboundDate(dto.getInboundDate());
                inv.setExpectedSalePrice(dto.getExpectedSalePrice());
                inv.setWarehouseLocation(dto.getWarehouseLocation());
                inv.setInventoryStatus("IN_STOCK");
                inv.setDaysInStock(task.getInventoryDays());
                inventoryMapper.insert(inv);
            }
            updateTaskStatus(task, TaskStatusEnum.NORMAL_CLOSED.getCode(), dto.getOperatorId(),
                    ActionTypeEnum.NORMAL_CLOSE.getCode(), dto.getCloseReason(), null);
        } else if ("REJECT".equals(dto.getCloseType())) {
            updateTaskStatus(task, TaskStatusEnum.REJECT_CLOSED.getCode(), dto.getOperatorId(),
                    ActionTypeEnum.REJECT_CLOSE.getCode(), dto.getCloseReason(), null);
        } else {
            updateTaskStatus(task, TaskStatusEnum.CANCELLED.getCode(), dto.getOperatorId(),
                    ActionTypeEnum.CANCEL.getCode(), dto.getCloseReason(), null);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void cancelTask(Long taskId, Long operatorId, String reason) {
        AcquisitionTask task = getTaskOrThrow(taskId);
        checkTaskNotClosed(task);
        task.setCloseType("CANCEL");
        task.setCloseReason(reason);
        task.setCloseTime(LocalDateTime.now());
        task.setIsActive(0);
        updateTaskStatus(task, TaskStatusEnum.CANCELLED.getCode(), operatorId,
                ActionTypeEnum.CANCEL.getCode(), reason, null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void uploadMaterial(MaterialUploadDTO dto) {
        FinanceMaterial mat = new FinanceMaterial();
        mat.setTaskId(dto.getTaskId());
        mat.setMaterialType(dto.getMaterialType());
        mat.setMaterialName(dto.getMaterialName());
        mat.setFileUrl(dto.getFileUrl());
        mat.setFileSize(dto.getFileSize());
        mat.setIsOriginal(dto.getIsOriginal());
        mat.setIsMissing(0);
        mat.setUploadBy(dto.getUploadBy());
        mat.setUploadTime(LocalDateTime.now());
        mat.setRemark(dto.getRemark());
        materialMapper.insert(mat);
        redisTemplate.delete(TASK_DETAIL_CACHE_KEY + dto.getTaskId());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void verifyMaterial(Long materialId, Long operatorId) {
        FinanceMaterial mat = materialMapper.selectById(materialId);
        if (mat == null) throw new BusinessException("资料不存在");
        mat.setIsVerified(1);
        mat.setVerifyBy(operatorId);
        mat.setVerifyTime(LocalDateTime.now());
        materialMapper.updateById(mat);
        redisTemplate.delete(TASK_DETAIL_CACHE_KEY + mat.getTaskId());
    }

    @Override
    public Map<String, Object> getStatistics(String startTime, String endTime) {
        LocalDateTime start = StrUtil.isNotBlank(startTime) ?
                LocalDateTime.parse(startTime, DateTimeFormatter.ISO_DATE_TIME) : null;
        LocalDateTime end = StrUtil.isNotBlank(endTime) ?
                LocalDateTime.parse(endTime, DateTimeFormatter.ISO_DATE_TIME) : null;
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("taskOverview", taskMapper.getOverviewStats(start, end));
        result.put("inventoryTurnover", inventoryMapper.getInventoryTurnoverStats());
        return result;
    }

    @Override
    public List<Map<String, Object>> getSourceStats(String startTime, String endTime) {
        LocalDateTime start = StrUtil.isNotBlank(startTime) ?
                LocalDateTime.parse(startTime, DateTimeFormatter.ISO_DATE_TIME) : null;
        LocalDateTime end = StrUtil.isNotBlank(endTime) ?
                LocalDateTime.parse(endTime, DateTimeFormatter.ISO_DATE_TIME) : null;
        List<Map<String, Object>> list = taskMapper.countBySourceType(start, end);
        list.forEach(m -> {
            Object t = m.get("sourceType");
            if (t != null) m.put("sourceTypeDesc", SourceTypeEnum.getDesc(t.toString()));
        });
        return list;
    }

    @Override
    public List<Map<String, Object>> getSalesStats(String startTime, String endTime) {
        LocalDateTime start = StrUtil.isNotBlank(startTime) ?
                LocalDateTime.parse(startTime, DateTimeFormatter.ISO_DATE_TIME) : null;
        LocalDateTime end = StrUtil.isNotBlank(endTime) ?
                LocalDateTime.parse(endTime, DateTimeFormatter.ISO_DATE_TIME) : null;
        return taskMapper.countBySales(start, end);
    }

    @Override
    public List<Map<String, Object>> getCloseTypeStats(String startTime, String endTime) {
        LocalDateTime start = StrUtil.isNotBlank(startTime) ?
                LocalDateTime.parse(startTime, DateTimeFormatter.ISO_DATE_TIME) : null;
        LocalDateTime end = StrUtil.isNotBlank(endTime) ?
                LocalDateTime.parse(endTime, DateTimeFormatter.ISO_DATE_TIME) : null;
        return taskMapper.countByCloseType(start, end);
    }
}
