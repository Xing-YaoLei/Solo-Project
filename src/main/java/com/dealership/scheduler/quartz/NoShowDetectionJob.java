package com.dealership.scheduler.quartz;

import com.dealership.scheduler.service.NoShowService;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class NoShowDetectionJob implements Job {

    @Autowired
    private NoShowService noShowService;

    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        try {
            noShowService.detectAndMarkNoShows();
        } catch (Exception e) {
            throw new JobExecutionException("爽约检测任务执行失败", e);
        }
    }
}
