package com.youth.training.service;

import com.youth.training.dto.ExceptionOrderDTO;
import com.youth.training.dto.StatusChangeDTO;
import com.youth.training.entity.ExceptionOrder;
import com.youth.training.repository.ExceptionOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class ExceptionOrderService {

    @Autowired
    private ExceptionOrderRepository exceptionOrderRepository;

    @Autowired
    private StatusHistoryService statusHistoryService;

    private static final String PENDING_STATUS = "PENDING";
    private static final String RESOLVED_STATUS = "RESOLVED";
    private static final String CLOSED_STATUS = "CLOSED";

    private final AtomicInteger orderSequence = new AtomicInteger(0);

    @Transactional
    @CacheEvict(value = {"exceptionOrder", "pendingOrders", "studentExceptionOrders"}, allEntries = true)
    public ExceptionOrder createExceptionOrder(ExceptionOrderDTO dto) {
        ExceptionOrder order = new ExceptionOrder();
        order.setOrderNo(generateOrderNo());
        order.setExceptionType(dto.getExceptionType());
        order.setPriority(dto.getPriority());
        order.setTitle(dto.getTitle());
        order.setDescription(dto.getDescription());
        order.setStudentId(dto.getStudentId());
        order.setCourseId(dto.getCourseId());
        order.setImpactScope(dto.getImpactScope());
        order.setResponsiblePerson(dto.getResponsiblePerson());
        order.setHandlingDepartment(dto.getHandlingDepartment());
        order.setCompletionRateBefore(dto.getCompletionRateBefore());
        order.setStatus(PENDING_STATUS);
        order.setCreatedBy(dto.getCreatedBy());
        order.setDeadline(dto.getDeadline());

        ExceptionOrder saved = exceptionOrderRepository.save(order);

        StatusChangeDTO statusDTO = new StatusChangeDTO();
        statusDTO.setBusinessId(saved.getId());
        statusDTO.setBusinessType("EXCEPTION_ORDER");
        statusDTO.setOldStatus("");
        statusDTO.setNewStatus(PENDING_STATUS);
        statusDTO.setChangeReason("创建异常单: " + dto.getTitle());
        statusDTO.setOperator(dto.getCreatedBy() != null ? dto.getCreatedBy() : "SYSTEM");
        statusHistoryService.saveStatusHistory(statusDTO);

        return saved;
    }

    @Transactional
    @CacheEvict(value = {"exceptionOrder", "pendingOrders", "studentExceptionOrders"}, allEntries = true)
    public ExceptionOrder resolveException(Long orderId, String handlingResult, String handledBy, Double completionRateAfter) {
        ExceptionOrder order = exceptionOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("异常单不存在: " + orderId));

        String oldStatus = order.getStatus();
        Double completionRateBefore = order.getCompletionRateBefore();

        order.setHandlingResult(handlingResult);
        order.setHandledBy(handledBy);
        order.setHandleTime(LocalDateTime.now());
        order.setCompletionRateBefore(completionRateBefore);
        order.setCompletionRateAfter(completionRateAfter);
        order.setStatus(RESOLVED_STATUS);

        ExceptionOrder saved = exceptionOrderRepository.save(order);

        if (!Objects.equals(oldStatus, RESOLVED_STATUS)) {
            StatusChangeDTO statusDTO = new StatusChangeDTO();
            statusDTO.setBusinessId(saved.getId());
            statusDTO.setBusinessType("EXCEPTION_ORDER");
            statusDTO.setOldStatus(oldStatus);
            statusDTO.setNewStatus(RESOLVED_STATUS);
            statusDTO.setChangeReason("异常单已解决，处理结果: " + handlingResult + "，完成率变化: " + completionRateBefore + "% -> " + completionRateAfter + "%");
            statusDTO.setOperator(handledBy);
            statusHistoryService.saveStatusHistory(statusDTO);
        }

        return saved;
    }

    @Cacheable(value = "pendingOrders", key = "'all'")
    public List<ExceptionOrder> getPendingOrders() {
        return exceptionOrderRepository.findByStatusOrderByCreateTimeDesc(PENDING_STATUS);
    }

    @Cacheable(value = "studentExceptionOrders", key = "'student:' + #studentId")
    public List<ExceptionOrder> getOrdersByStudent(Long studentId) {
        return exceptionOrderRepository.findByStudentIdOrderByCreateTimeDesc(studentId);
    }

    public boolean existsActiveException(Long studentId, String exceptionType) {
        List<ExceptionOrder> allOrders = exceptionOrderRepository.findByExceptionTypeOrderByCreateTimeDesc(exceptionType);
        return allOrders.stream()
                .filter(o -> o.getStudentId() != null && o.getStudentId().equals(studentId))
                .anyMatch(o -> PENDING_STATUS.equals(o.getStatus()));
    }

    private synchronized String generateOrderNo() {
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int seq = orderSequence.incrementAndGet();
        if (seq > 999999) {
            orderSequence.set(1);
            seq = 1;
        }
        String orderNo = "EXC" + dateStr + String.format("%06d", seq);
        while (exceptionOrderRepository.existsByOrderNo(orderNo)) {
            seq = orderSequence.incrementAndGet();
            orderNo = "EXC" + dateStr + String.format("%06d", seq);
        }
        return orderNo;
    }
}
