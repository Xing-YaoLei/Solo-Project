package com.testdrive.repository;

import com.testdrive.entity.SalesFollowUp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SalesFollowUpRepository extends JpaRepository<SalesFollowUp, Long> {
    List<SalesFollowUp> findByVehicleId(Long vehicleId);
    List<SalesFollowUp> findByAppointmentId(Long appointmentId);
    List<SalesFollowUp> findBySalesPerson(String salesPerson);

    @Query("SELECT s FROM SalesFollowUp s WHERE s.appointmentId IN :appointmentIds "
         + "AND (:salesPerson IS NULL OR s.salesPerson = :salesPerson) "
         + "AND (:leadSource IS NULL OR s.leadSource = :leadSource) "
         + "AND (:leadStatus IS NULL OR s.leadStatus = :leadStatus)")
    List<SalesFollowUp> findByAppointmentIdsWithFilters(
            @Param("appointmentIds") List<Long> appointmentIds,
            @Param("salesPerson") String salesPerson,
            @Param("leadSource") String leadSource,
            @Param("leadStatus") String leadStatus);
}
