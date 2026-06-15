package com.renewal.repository;

import com.renewal.entity.Student;
import com.renewal.entity.Student.SourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findBySourceAndSourceId(SourceType source, String sourceId);

    boolean existsBySourceAndSourceId(SourceType source, String sourceId);
}
