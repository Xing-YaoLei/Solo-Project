package com.youth.training.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "student")
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String studentName;

    @Column(length = 20)
    private String gender;

    private Integer age;

    private String grade;

    @Column(length = 20)
    private String phone;

    @Column(length = 100)
    private String parentName;

    @Column(length = 20)
    private String parentPhone;

    @Column(length = 200)
    private String address;

    @Column(nullable = false, length = 20)
    private String status;

    private LocalDate enrollDate;

    private LocalDate expireDate;

    @Column(length = 100)
    private String responsibleTeacher;

    @Column(length = 500)
    private String remark;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createTime;

    @UpdateTimestamp
    private LocalDateTime updateTime;
}
