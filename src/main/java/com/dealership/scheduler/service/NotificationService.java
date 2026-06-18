package com.dealership.scheduler.service;

import com.dealership.scheduler.entity.Notification;
import com.dealership.scheduler.entity.SysUser;

import java.util.List;

public interface NotificationService {
    void createNoShowNotification(Long noShowRecordId, String customerName, String vehicleName);
    List<Notification> getUserNotifications(Long userId, SysUser.Role role);
    long getUnreadCount(Long userId);
    void markAsRead(Long id);
    void markAllAsRead(Long userId);
}
