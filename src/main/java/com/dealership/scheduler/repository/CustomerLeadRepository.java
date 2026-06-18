package com.dealership.scheduler.repository;

import com.dealership.scheduler.entity.CustomerLead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CustomerLeadRepository extends JpaRepository<CustomerLead, Long>, JpaSpecificationExecutor<CustomerLead> {
    List<CustomerLead> findByStatus(CustomerLead.LeadStatus status);
    List<CustomerLead> findByOwnerId(Long ownerId);
    List<CustomerLead> findByPhone(String phone);

    @Query("SELECT cl FROM CustomerLead cl WHERE cl.createTime BETWEEN :start AND :end")
    List<CustomerLead> findByCreateTimeBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT cl.status, COUNT(cl) FROM CustomerLead cl WHERE cl.createTime BETWEEN :start AND :end GROUP BY cl.status")
    List<Object[]> countByStatusInPeriod(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
