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
@Table(name = "renewal_follow")
public class RenewalFollow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long studentId;

    @Column(length = 100)
    private String followNo;

    @Column(nullable = false, length = 50)
    private String followStage;

    @Column(length = 200)
    private String followTheme;

    @Column(length = 2000)
    private String followContent;

    @Column(length = 200)
    private String followMethod;

    private LocalDate planDate;

    private LocalDate actualDate;

    @Column(length = 100)
    private String followPerson;

    @Column(length = 500)
    private String studentFeedback;

    @Column(length = 500)
    private String parentFeedback;

    @Column(length = 20)
    private String renewalIntention;

    @Column(length = 20)
    private String renewalStatus;

    @Column(length = 500)
    private String nextStep;

    private LocalDate nextFollowDate;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(length = 500)
    private String remark;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createTime;

    @UpdateTimestamp
    private LocalDateTime updateTime;
}
