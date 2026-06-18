package com.dealership.scheduler;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TestDriveSchedulerApplication {
    public static void main(String[] args) {
        SpringApplication.run(TestDriveSchedulerApplication.class, args);
    }
}
