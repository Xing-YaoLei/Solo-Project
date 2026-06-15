package com.youth.training.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "exception_order")
public class ExceptionOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50, unique = true)
    private String orderNo;

    @Column(nullable = false, length = 50)
    private String exceptionType;

    @Column(nullable = false, length = 20)
    private String priority;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(length = 2000)
    private String description;

    private Long studentId;

    private Long courseId;

    @Column(length = 500)
    private String impactScope;

    @Column(length = 200)
    private String responsiblePerson;

    @Column(length = 200)
    private String handlingDepartment;

    @Column(length = 2000)
    private String handlingResult;

    private Double completionRateBefore;

    private Double completionRateAfter;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(length = 100)
    private String createdBy;

    @Column(length = 100)
    private String handledBy;

    private LocalDateTime handleTime;

    private LocalDateTime deadline;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createTime;

    @UpdateTimestamp
    private LocalDateTime updateTime;
}
