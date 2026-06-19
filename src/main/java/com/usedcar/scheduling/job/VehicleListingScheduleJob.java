package com.usedcar.scheduling.job;

import com.usedcar.scheduling.domain.Vehicle;
import com.usedcar.scheduling.enums.VehicleStatus;
import com.usedcar.scheduling.repository.VehicleRepository;
import com.usedcar.scheduling.service.FinanceDocumentService;
import com.usedcar.scheduling.service.PreparationService;
import com.usedcar.scheduling.service.VehicleService;
import lombok.extern.slf4j.Slf4j;
import org.quartz.JobExecutionContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.quartz.QuartzJobBean;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
public class VehicleListingScheduleJob extends QuartzJobBean {

    @Autowired
    private VehicleService vehicleService;

    @Autowired
    private PreparationService preparationService;

    @Autowired
    private FinanceDocumentService financeDocumentService;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Override
    protected void executeInternal(JobExecutionContext context) {
        log.info("VehicleListingScheduleJob started");

        int actionsTaken = 0;

        List<Vehicle> preparingVehicles = vehicleRepository.findByStatus(VehicleStatus.PREPARING);
        for (Vehicle vehicle : preparingVehicles) {
            if (preparationService.isAllCompleted(vehicle.getId())) {
                vehicleService.updateStatus(vehicle.getId(), VehicleStatus.PENDING_INSPECTION, null, "Auto: preparation completed");
                actionsTaken++;
                log.info("Vehicle {} auto-updated from PREPARING to PENDING_INSPECTION", vehicle.getId());
            }
        }

        List<Vehicle> pendingListingVehicles = vehicleRepository.findByStatus(VehicleStatus.PENDING_LISTING);
        for (Vehicle vehicle : pendingListingVehicles) {
            List<?> missingDocs = financeDocumentService.findMissingDocuments(vehicle.getId());
            if (missingDocs.isEmpty()) {
                vehicleService.updateStatus(vehicle.getId(), VehicleStatus.LISTED, null, "Auto: all documents complete");
                actionsTaken++;
                log.info("Vehicle {} auto-updated from PENDING_LISTING to LISTED", vehicle.getId());
            }
        }

        log.info("VehicleListingScheduleJob completed, actions taken: {}", actionsTaken);
    }
}
