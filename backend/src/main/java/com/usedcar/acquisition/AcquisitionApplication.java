package com.usedcar.acquisition;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@MapperScan("com.usedcar.acquisition.mapper")
@EnableCaching
public class AcquisitionApplication {
    public static void main(String[] args) {
        SpringApplication.run(AcquisitionApplication.class, args);
    }
}
