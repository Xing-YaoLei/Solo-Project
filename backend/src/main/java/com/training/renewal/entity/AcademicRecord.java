package com.training.renewal.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "academic_record", indexes = {
    @Index(name = "idx_student_no", columnList = "studentNo"),
    @Index(name = "idx_batch_id", columnList = "batchId"),
    @Index(name = "idx_exam_date", columnList = "examDate")
})
public class AcademicRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 32)
    private String batchId;

    @Column(nullable = false, length = 32)
    private String studentNo;

    @Column(length = 64)
    private String courseName;

    @Column(length = 32)
    private String courseTag;

    private LocalDate examDate;

    @Column(length = 64)
    private String examName;

    @Column(precision = 5, scale = 2)
    private BigDecimal score;

    @Column(precision = 5, scale = 2)
    private BigDecimal classRank;

    @Column(precision = 5, scale = 2)
    private BigDecimal gradeRank;

    @Column(precision = 5, scale = 2)
    private BigDecimal progressRate;

    @Column(length = 255)
    private String teacherComment;

    @Column(length = 16)
    private String level;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createTime;

    @Column(length = 64)
    private String dataSource;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getBatchId() {
        return batchId;
    }

    public void setBatchId(String batchId) {
        this.batchId = batchId;
    }

    public String getStudentNo() {
        return studentNo;
    }

    public void setStudentNo(String studentNo) {
        this.studentNo = studentNo;
    }

    public String getCourseName() {
        return courseName;
    }

    public void setCourseName(String courseName) {
        this.courseName = courseName;
    }

    public String getCourseTag() {
        return courseTag;
    }

    public void setCourseTag(String courseTag) {
        this.courseTag = courseTag;
    }

    public LocalDate getExamDate() {
        return examDate;
    }

    public void setExamDate(LocalDate examDate) {
        this.examDate = examDate;
    }

    public String getExamName() {
        return examName;
    }

    public void setExamName(String examName) {
        this.examName = examName;
    }

    public BigDecimal getScore() {
        return score;
    }

    public void setScore(BigDecimal score) {
        this.score = score;
    }

    public BigDecimal getClassRank() {
        return classRank;
    }

    public void setClassRank(BigDecimal classRank) {
        this.classRank = classRank;
    }

    public BigDecimal getGradeRank() {
        return gradeRank;
    }

    public void setGradeRank(BigDecimal gradeRank) {
        this.gradeRank = gradeRank;
    }

    public BigDecimal getProgressRate() {
        return progressRate;
    }

    public void setProgressRate(BigDecimal progressRate) {
        this.progressRate = progressRate;
    }

    public String getTeacherComment() {
        return teacherComment;
    }

    public void setTeacherComment(String teacherComment) {
        this.teacherComment = teacherComment;
    }

    public String getLevel() {
        return level;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }

    public String getDataSource() {
        return dataSource;
    }

    public void setDataSource(String dataSource) {
        this.dataSource = dataSource;
    }
}
