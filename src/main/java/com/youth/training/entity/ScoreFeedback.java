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
@Table(name = "score_feedback")
public class ScoreFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long studentId;

    @Column(nullable = false)
    private Long homeworkId;

    private Long questionId;

    private Double score;

    private Double totalScore;

    @Column(length = 500)
    private String answerContent;

    @Column(length = 500)
    private String teacherComment;

    @Column(length = 20)
    private String gradeLevel;

    @Column(length = 500)
    private String weakPoints;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(length = 100)
    private String reviewedBy;

    private LocalDateTime reviewTime;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createTime;

    @UpdateTimestamp
    private LocalDateTime updateTime;
}
