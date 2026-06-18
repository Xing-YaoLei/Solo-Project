package com.dealership.scheduler.service.impl;

import com.dealership.scheduler.entity.Notification;
import com.dealership.scheduler.entity.SysUser;
import com.dealership.scheduler.repository.NotificationRepository;
import com.dealership.scheduler.repository.SysUserRepository;
import com.dealership.scheduler.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationServiceImpl implements NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private SysUserRepository userRepository;

    @Value("${app.no-show.notify-roles:SALES_MANAGER,STORE_MANAGER}")
    private String notifyRoles;

    @Override
    @Transactional
    public void createNoShowNotification(Long appointmentId, String customerName, String vehicleName) {
        List<SysUser.Role> roles = Arrays.stream(notifyRoles.split(","))
                .map(String::trim)
                .map(SysUser.Role::valueOf)
                .collect(Collectors.toList());

        for (SysUser.Role role : roles) {
            Notification notification = new Notification();
            notification.setType(Notification.NotificationType.NO_SHOW);
            notification.setTitle("试驾爽约提醒");
            notification.setContent("客户【" + customerName + "】预约试驾【" + vehicleName + "】出现爽约，请及时处理。");
            notification.setTargetRole(role);
            notification.setRelatedId(appointmentId);
            notification.setReadFlag(false);
            notificationRepository.save(notification);
        }
    }

    @Override
    public List<Notification> getUserNotifications(Long userId, SysUser.Role role) {
        List<Notification> result = new ArrayList<>();
        if (userId != null) {
            result.addAll(notificationRepository.findByTargetUserIdOrderByCreateTimeDesc(userId));
        }
        if (role != null) {
            result.addAll(notificationRepository.findByTargetRoleAndTargetUserIsNullOrderByCreateTimeDesc(role));
        }
        result.sort((a, b) -> b.getCreateTime().compareTo(a.getCreateTime()));
        return result;
    }

    @Override
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByTargetUserIdAndReadFlagFalse(userId);
    }

    @Override
    @Transactional
    public void markAsRead(Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setReadFlag(true);
            notificationRepository.save(n);
        });
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> notifications = notificationRepository.findByTargetUserIdAndReadFlagFalse(userId);
        for (Notification n : notifications) {
            n.setReadFlag(true);
            notificationRepository.save(n);
        }
    }
}
