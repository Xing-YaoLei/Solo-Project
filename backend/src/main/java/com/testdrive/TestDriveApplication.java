package com.testdrive;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TestDriveApplication {
    public static void main(String[] args) {
        SpringApplication.run(TestDriveApplication.class, args);
    }
}
