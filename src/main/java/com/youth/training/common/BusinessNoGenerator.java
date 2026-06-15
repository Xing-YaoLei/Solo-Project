package com.youth.training.common;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

public class BusinessNoGenerator {
    private static final AtomicInteger COUNTER = new AtomicInteger(0);

    public static String generate(String prefix) {
        String date = DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDate.now());
        int seq = COUNTER.incrementAndGet() % 1000000;
        return prefix + date + String.format("%06d", seq);
    }

    public static String generateWithRandom(String prefix) {
        String date = DateTimeFormatter.ofPattern("yyyyMMddHHmmss").format(LocalDateTime.now());
        String rand = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return prefix + date + rand;
    }
}
