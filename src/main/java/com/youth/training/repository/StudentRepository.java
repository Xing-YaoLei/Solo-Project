package com.youth.training.repository;

import com.youth.training.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long>, JpaSpecificationExecutor<Student> {
    List<Student> findByStatus(String status);
    List<Student> findByResponsibleTeacher(String teacher);
    List<Student> findByExpireDateBeforeAndStatus(LocalDate date, String status);
    List<Student> findByExpireDateBetweenAndStatus(LocalDate start, LocalDate end, String status);
}
