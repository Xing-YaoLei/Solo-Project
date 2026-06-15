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
@Table(name = "learning_progress")
public class LearningProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long studentId;

    @Column(nullable = false)
    private Long courseId;

    private Long chapterId;

    private Long homeworkId;

    @Column(nullable = false, length = 20)
    private String progressType;

    @Column(nullable = false)
    private Double completionRate;

    @Column(nullable = false)
    private Integer completedCount;

    @Column(nullable = false)
    private Integer totalCount;

    private Integer studyDuration;

    @Column(length = 500)
    private String remark;

    @Column(nullable = false, length = 20)
    private String status;

    private LocalDateTime lastStudyTime;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createTime;

    @UpdateTimestamp
    private LocalDateTime updateTime;
}
