package com.usedcar.scheduling.job;

import com.usedcar.scheduling.enums.VehicleStatus;
import com.usedcar.scheduling.repository.VehicleRepository;
import com.usedcar.scheduling.service.TodoPoolService;
import lombok.extern.slf4j.Slf4j;
import org.quartz.JobExecutionContext;
import org.springframework.scheduling.quartz.QuartzJobBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
public class MissingDocumentCheckJob extends QuartzJobBean {

    @Autowired
    private TodoPoolService todoPoolService;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Override
    protected void executeInternal(JobExecutionContext context) {
        log.info("MissingDocumentCheckJob started");

        List<Long> vehicleIds = vehicleRepository
                .findByStatusIn(List.of(VehicleStatus.PENDING_LISTING, VehicleStatus.PENDING_INSPECTION))
                .stream()
                .map(v -> v.getId())
                .toList();

        for (Long vehicleId : vehicleIds) {
            todoPoolService.checkMissingDocuments(vehicleId);
        }

        log.info("MissingDocumentCheckJob completed, checked {} vehicles", vehicleIds.size());
    }
}
