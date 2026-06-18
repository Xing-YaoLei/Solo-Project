package com.dealership.scheduler.repository;

import com.dealership.scheduler.entity.Notification;
import com.dealership.scheduler.entity.SysUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByTargetUserIdOrderByCreateTimeDesc(Long userId);
    List<Notification> findByTargetRoleAndTargetUserIsNullOrderByCreateTimeDesc(SysUser.Role role);
    List<Notification> findByTargetUserIdAndReadFlagFalse(Long userId);
    List<Notification> findByTargetRoleAndReadFlagFalseAndTargetUserIsNull(SysUser.Role role);
    long countByTargetUserIdAndReadFlagFalse(Long userId);
}
