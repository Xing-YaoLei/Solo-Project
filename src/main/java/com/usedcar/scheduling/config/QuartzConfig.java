package com.usedcar.scheduling.config;

import com.usedcar.scheduling.job.MissingDocumentCheckJob;
import com.usedcar.scheduling.job.PreparationOverdueCheckJob;
import com.usedcar.scheduling.job.VehicleListingScheduleJob;
import org.quartz.CronScheduleBuilder;
import org.quartz.JobBuilder;
import org.quartz.JobDetail;
import org.quartz.Trigger;
import org.quartz.TriggerBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class QuartzConfig {

    @Bean
    public JobDetail missingDocCheckJobDetail() {
        return JobBuilder.newJob(MissingDocumentCheckJob.class)
                .withIdentity("missingDocCheckJob")
                .storeDurably()
                .build();
    }

    @Bean
    public Trigger missingDocCheckTrigger() {
        return TriggerBuilder.newTrigger()
                .forJob(missingDocCheckJobDetail())
                .withIdentity("missingDocCheckTrigger")
                .withSchedule(CronScheduleBuilder.cronSchedule("0 0 * * * ?"))
                .build();
    }

    @Bean
    public JobDetail vehicleListingScheduleJobDetail() {
        return JobBuilder.newJob(VehicleListingScheduleJob.class)
                .withIdentity("vehicleListingScheduleJob")
                .storeDurably()
                .build();
    }

    @Bean
    public Trigger vehicleListingScheduleTrigger() {
        return TriggerBuilder.newTrigger()
                .forJob(vehicleListingScheduleJobDetail())
                .withIdentity("vehicleListingScheduleTrigger")
                .withSchedule(CronScheduleBuilder.cronSchedule("0 */30 * * * ?"))
                .build();
    }

    @Bean
    public JobDetail preparationOverdueCheckJobDetail() {
        return JobBuilder.newJob(PreparationOverdueCheckJob.class)
                .withIdentity("preparationOverdueCheckJob")
                .storeDurably()
                .build();
    }

    @Bean
    public Trigger preparationOverdueCheckTrigger() {
        return TriggerBuilder.newTrigger()
                .forJob(preparationOverdueCheckJobDetail())
                .withIdentity("preparationOverdueCheckTrigger")
                .withSchedule(CronScheduleBuilder.cronSchedule("0 0 9 * * ?"))
                .build();
    }
}
