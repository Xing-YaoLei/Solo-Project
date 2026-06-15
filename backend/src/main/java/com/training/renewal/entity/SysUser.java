package com.training.renewal.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "sys_user", indexes = {
    @Index(name = "idx_username", columnList = "username", unique = true),
    @Index(name = "idx_role", columnList = "role")
})
public class SysUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 32, unique = true)
    private String username;

    @Column(nullable = false, length = 128)
    private String password;

    @Column(nullable = false, length = 64)
    private String realName;

    @Column(length = 16)
    private String role;

    @Column(length = 32)
    private String department;

    @Column(length = 32)
    private String phone;

    @Column(length = 64)
    private String email;

    @Column(length = 16)
    private String status;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createTime;

    @UpdateTimestamp
    private LocalDateTime updateTime;
}
