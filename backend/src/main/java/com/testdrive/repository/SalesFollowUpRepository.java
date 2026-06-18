package com.testdrive.repository;

import com.testdrive.entity.SalesFollowUp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SalesFollowUpRepository extends JpaRepository<SalesFollowUp, Long> {
    List<SalesFollowUp> findByVehicleId(Long vehicleId);
    List<SalesFollowUp> findByAppointmentId(Long appointmentId);
    List<SalesFollowUp> findBySalesPerson(String salesPerson);
}
