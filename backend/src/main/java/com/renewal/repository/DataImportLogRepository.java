package com.renewal.repository;

import com.renewal.entity.DataImportLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DataImportLogRepository extends JpaRepository<DataImportLog, Long> {
}
