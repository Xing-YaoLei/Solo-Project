package com.youth.training.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "training.dashboard")
public class DashboardProperties {

    private Progress progress = new Progress();

    private Renewal renewal = new Renewal();

    private Export export = new Export();

    @Data
    public static class Progress {
        private Double warningThreshold;
        private Double dangerThreshold;
        private String checkCron;
    }

    @Data
    public static class Renewal {
        private Integer earlyWarningDays;
        private String followCron;
    }

    @Data
    public static class Export {
        private String dataCaliber;
        private String sheetPassword;
    }
}
