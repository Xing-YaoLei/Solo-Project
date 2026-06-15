package com.youth.training.config;

import com.youth.training.job.ProgressCheckJob;
import com.youth.training.job.RenewalReminderJob;
import org.quartz.CronScheduleBuilder;
import org.quartz.JobDetail;
import org.quartz.Trigger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.quartz.CronTriggerFactoryBean;
import org.springframework.scheduling.quartz.JobDetailFactoryBean;

@Configuration
public class QuartzConfig {

    @Value("${training.dashboard.progress.checkCron:0 0 2 * * ?}")
    private String progressCheckCron;

    @Value("${training.dashboard.renewal.followCron:0 30 9 * * ?}")
    private String renewalReminderCron;

    @Bean
    public JobDetailFactoryBean progressCheckJobDetail() {
        JobDetailFactoryBean factoryBean = new JobDetailFactoryBean();
        factoryBean.setJobClass(ProgressCheckJob.class);
        factoryBean.setName("progressCheckJob");
        factoryBean.setGroup("dashboardGroup");
        factoryBean.setDescription("进度检测任务");
        factoryBean.setDurability(true);
        factoryBean.setRequestsRecovery(true);
        return factoryBean;
    }

    @Bean
    public CronTriggerFactoryBean progressCheckTrigger(JobDetail progressCheckJobDetail) {
        CronTriggerFactoryBean factoryBean = new CronTriggerFactoryBean();
        factoryBean.setJobDetail(progressCheckJobDetail);
        factoryBean.setName("progressCheckTrigger");
        factoryBean.setGroup("dashboardGroup");
        factoryBean.setDescription("进度检测触发器");
        factoryBean.setCronExpression(progressCheckCron);
        return factoryBean;
    }

    @Bean
    public JobDetailFactoryBean renewalReminderJobDetail() {
        JobDetailFactoryBean factoryBean = new JobDetailFactoryBean();
        factoryBean.setJobClass(RenewalReminderJob.class);
        factoryBean.setName("renewalReminderJob");
        factoryBean.setGroup("dashboardGroup");
        factoryBean.setDescription("续费提醒任务");
        factoryBean.setDurability(true);
        factoryBean.setRequestsRecovery(true);
        return factoryBean;
    }

    @Bean
    public CronTriggerFactoryBean renewalReminderTrigger(JobDetail renewalReminderJobDetail) {
        CronTriggerFactoryBean factoryBean = new CronTriggerFactoryBean();
        factoryBean.setJobDetail(renewalReminderJobDetail);
        factoryBean.setName("renewalReminderTrigger");
        factoryBean.setGroup("dashboardGroup");
        factoryBean.setDescription("续费提醒触发器");
        factoryBean.setCronExpression(renewalReminderCron);
        return factoryBean;
    }
}
