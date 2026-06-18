package com.dealership.scheduler.config;

import com.dealership.scheduler.quartz.NoShowDetectionJob;
import org.quartz.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class QuartzConfig {

    @Value("${app.no-show.check-cron:0 0/30 * * * ?}")
    private String noShowCheckCron;

    @Bean
    public JobDetail noShowDetectionJobDetail() {
        return JobBuilder.newJob(NoShowDetectionJob.class)
                .withIdentity("noShowDetectionJob", "testDriveGroup")
                .withDescription("试驾爽约检测任务")
                .storeDurably()
                .build();
    }

    @Bean
    public Trigger noShowDetectionTrigger() {
        CronScheduleBuilder scheduleBuilder = CronScheduleBuilder.cronSchedule(noShowCheckCron);
        return TriggerBuilder.newTrigger()
                .forJob(noShowDetectionJobDetail())
                .withIdentity("noShowDetectionTrigger", "testDriveGroup")
                .withDescription("爽约检测触发器")
                .withSchedule(scheduleBuilder)
                .build();
    }
}
