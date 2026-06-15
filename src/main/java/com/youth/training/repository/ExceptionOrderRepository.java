package com.youth.training.repository;

import com.youth.training.entity.ExceptionOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExceptionOrderRepository extends JpaRepository<ExceptionOrder, Long>, JpaSpecificationExecutor<ExceptionOrder> {
    List<ExceptionOrder> findByStatusOrderByCreateTimeDesc(String status);
    List<ExceptionOrder> findByStudentIdOrderByCreateTimeDesc(Long studentId);
    List<ExceptionOrder> findByExceptionTypeOrderByCreateTimeDesc(String exceptionType);
    List<ExceptionOrder> findByPriorityOrderByCreateTimeDesc(String priority);
    List<ExceptionOrder> findByResponsiblePersonOrderByCreateTimeDesc(String person);
    ExceptionOrder findByOrderNo(String orderNo);
    boolean existsByOrderNo(String orderNo);
}
