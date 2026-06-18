package com.testdrive.repository;

import com.testdrive.entity.TestDriveFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TestDriveFeedbackRepository extends JpaRepository<TestDriveFeedback, Long> {
    Optional<TestDriveFeedback> findByAppointmentId(Long appointmentId);
    List<TestDriveFeedback> findByVehicleId(Long vehicleId);
}
