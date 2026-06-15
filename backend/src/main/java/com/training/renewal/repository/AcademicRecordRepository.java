package com.training.renewal.repository;

import com.training.renewal.entity.AcademicRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AcademicRecordRepository extends JpaRepository<AcademicRecord, Long> {

    List<AcademicRecord> findByStudentNoOrderByExamDateDesc(String studentNo);

    List<AcademicRecord> findByBatchId(String batchId);

    @Query("SELECT a.courseTag, AVG(a.score), COUNT(a) FROM AcademicRecord a GROUP BY a.courseTag")
    List<Object[]> getScoreStatsByCourseTag();

    @Query("SELECT a.studentNo, AVG(a.score) as avgScore FROM AcademicRecord a " +
           "WHERE a.examDate >= (SELECT MIN(a2.examDate) FROM AcademicRecord a2) " +
           "GROUP BY a.studentNo ORDER BY avgScore DESC LIMIT :limit")
    List<Object[]> getTopStudentsByScore(@Param("limit") int limit);

    @Query("SELECT a.studentNo, AVG(a.progressRate) as avgProgress FROM AcademicRecord a " +
           "GROUP BY a.studentNo ORDER BY avgProgress ASC LIMIT :limit")
    List<Object[]> getBottomStudentsByProgress(@Param("limit") int limit);

    @Query("SELECT a.courseTag, a.level, COUNT(a) FROM AcademicRecord a GROUP BY a.courseTag, a.level")
    List<Object[]> getLevelDistribution();
}
