package com.training.renewal.service;

import com.training.renewal.entity.StudentEnrollment;
import com.training.renewal.repository.AcademicRecordRepository;
import com.training.renewal.repository.ParentFeedbackRepository;
import com.training.renewal.repository.StudentEnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final StudentEnrollmentRepository enrollmentRepository;
    private final AcademicRecordRepository academicRepository;
    private final ParentFeedbackRepository feedbackRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CACHE_PREFIX = "dashboard:";
    private static final long CACHE_EXPIRE = 1800;

    public Map<String, Object> getOverviewStats() {
        String cacheKey = CACHE_PREFIX + "overview";
        @SuppressWarnings("unchecked")
        Map<String, Object> cached = (Map<String, Object>) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        Map<String, Object> result = new LinkedHashMap<>();

        long totalStudents = enrollmentRepository.count();
        long lowProgressCount = enrollmentRepository.countByCompletionRateLessThan(
                BigDecimal.valueOf(60));
        List<Object[]> tagDist = enrollmentRepository.countByCourseTag();
        List<Object[]> renewalDist = enrollmentRepository.countByRenewalStatus();

        long pendingFeedback = feedbackRepository.countByHandleStatus("PENDING");

        result.put("totalStudents", totalStudents);
        result.put("lowProgressCount", lowProgressCount);
        result.put("lowProgressRate", totalStudents > 0 ?
                (lowProgressCount * 100.0 / totalStudents) : 0);
        result.put("pendingFeedback", pendingFeedback);

        result.put("tagDistribution", tagDist.stream().map(arr -> Map.of(
                "tag", arr[0],
                "count", arr[1]
        )).toList());

        result.put("renewalDistribution", renewalDist.stream().map(arr -> Map.of(
                "status", arr[0],
                "count", arr[1]
        )).toList());

        redisTemplate.opsForValue().set(cacheKey, result, CACHE_EXPIRE, TimeUnit.SECONDS);
        return result;
    }

    public List<Map<String, Object>> getCourseTagDistribution() {
        String cacheKey = CACHE_PREFIX + "tag_distribution";
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> cached = (List<Map<String, Object>>) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        List<Object[]> raw = enrollmentRepository.countByCourseTag();
        List<Map<String, Object>> result = raw.stream().map(arr -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("tag", arr[0]);
            item.put("count", arr[1]);
            return item;
        }).toList();

        redisTemplate.opsForValue().set(cacheKey, result, CACHE_EXPIRE, TimeUnit.SECONDS);
        return result;
    }

    public List<Map<String, Object>> getProgressFunnel() {
        String cacheKey = CACHE_PREFIX + "progress_funnel";
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> cached = (List<Map<String, Object>>) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        List<Map<String, Object>> funnel = new ArrayList<>();

        long total = enrollmentRepository.count();
        long above90 = enrollmentRepository.countByCompletionRateLessThan(BigDecimal.valueOf(100))
                - enrollmentRepository.countByCompletionRateLessThan(BigDecimal.valueOf(90));
        long between7090 = enrollmentRepository.countByCompletionRateLessThan(BigDecimal.valueOf(90))
                - enrollmentRepository.countByCompletionRateLessThan(BigDecimal.valueOf(70));
        long between5070 = enrollmentRepository.countByCompletionRateLessThan(BigDecimal.valueOf(70))
                - enrollmentRepository.countByCompletionRateLessThan(BigDecimal.valueOf(50));
        long below50 = enrollmentRepository.countByCompletionRateLessThan(BigDecimal.valueOf(50));

        funnel.add(Map.of("stage", "学员总数", "value", total, "percent", 100.0));
        funnel.add(Map.of("stage", "90%以上", "value", above90,
                "percent", total > 0 ? (above90 * 100.0 / total) : 0));
        funnel.add(Map.of("stage", "70%-90%", "value", between7090,
                "percent", total > 0 ? (between7090 * 100.0 / total) : 0));
        funnel.add(Map.of("stage", "50%-70%", "value", between5070,
                "percent", total > 0 ? (between5070 * 100.0 / total) : 0));
        funnel.add(Map.of("stage", "50%以下", "value", below50,
                "percent", total > 0 ? (below50 * 100.0 / total) : 0));

        redisTemplate.opsForValue().set(cacheKey, funnel, CACHE_EXPIRE, TimeUnit.SECONDS);
        return funnel;
    }

    public List<Map<String, Object>> getScoreRanking(int limit) {
        String cacheKey = CACHE_PREFIX + "score_ranking:" + limit;
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> cached = (List<Map<String, Object>>) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        List<Object[]> raw = academicRepository.getTopStudentsByScore(limit);
        List<Map<String, Object>> result = new ArrayList<>();

        int rank = 1;
        for (Object[] row : raw) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("rank", rank++);
            item.put("studentNo", row[0]);
            item.put("avgScore", row[1]);
            result.add(item);
        }

        redisTemplate.opsForValue().set(cacheKey, result, CACHE_EXPIRE, TimeUnit.SECONDS);
        return result;
    }

    public List<Map<String, Object>> getBottomProgressStudents(int limit) {
        List<Object[]> raw = academicRepository.getBottomStudentsByProgress(limit);
        List<Map<String, Object>> result = new ArrayList<>();

        int rank = 1;
        for (Object[] row : raw) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("rank", rank++);
            item.put("studentNo", row[0]);
            item.put("avgProgress", row[1]);
            result.add(item);
        }

        return result;
    }

    public List<StudentEnrollment> getExpiringStudents(int days) {
        LocalDate now = LocalDate.now();
        LocalDate endDate = now.plusDays(days);
        return enrollmentRepository.findExpiringStudents(now, endDate);
    }

    public Map<String, Object> getConsultantStats(String consultantId) {
        Map<String, Object> result = new LinkedHashMap<>();

        List<StudentEnrollment> students = enrollmentRepository
                .findByConsultantIdOrderByCompletionRateAsc(consultantId);

        long total = students.size();
        long lowProgress = students.stream()
                .filter(s -> s.getCompletionRate() != null && s.getCompletionRate().compareTo(BigDecimal.valueOf(60)) < 0)
                .count();

        double avgCompletion = students.stream()
                .mapToDouble(s -> s.getCompletionRate() != null ? s.getCompletionRate().doubleValue() : 0)
                .average()
                .orElse(0);

        result.put("totalStudents", total);
        result.put("lowProgressCount", lowProgress);
        result.put("avgCompletionRate", avgCompletion);
        result.put("students", students);

        return result;
    }

    public List<Map<String, Object>> getAllConsultantStats() {
        List<Object[]> raw = enrollmentRepository.getConsultantStats();
        return raw.stream().map(arr -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("consultantId", arr[0]);
            item.put("consultantName", arr[1]);
            item.put("studentCount", arr[2]);
            item.put("avgCompletionRate", arr[3]);
            return item;
        }).toList();
    }

    public void evictDashboardCache() {
        Set<String> keys = redisTemplate.keys(CACHE_PREFIX + "*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }

    public Map<String, Object> getFeedbackSentimentStats() {
        String cacheKey = CACHE_PREFIX + "feedback_sentiment";
        @SuppressWarnings("unchecked")
        Map<String, Object> cached = (Map<String, Object>) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        List<Object[]> sentimentDist = feedbackRepository.getSentimentDistribution();
        long total = feedbackRepository.count();
        long pending = feedbackRepository.countByHandleStatus("PENDING");

        Map<String, Object> result = new LinkedHashMap<>();
        int positive = 0, neutral = 0, negative = 0;

        for (Object[] row : sentimentDist) {
            String sentiment = (String) row[0];
            Long count = ((Number) row[1]).longValue();
            if ("POSITIVE".equalsIgnoreCase(sentiment)) positive = count.intValue();
            else if ("NEUTRAL".equalsIgnoreCase(sentiment)) neutral = count.intValue();
            else if ("NEGATIVE".equalsIgnoreCase(sentiment)) negative = count.intValue();
        }

        result.put("positive", positive);
        result.put("neutral", neutral);
        result.put("negative", negative);
        result.put("pending", pending);
        result.put("total", total);

        redisTemplate.opsForValue().set(cacheKey, result, CACHE_EXPIRE, TimeUnit.SECONDS);
        return result;
    }

    public List<Map<String, Object>> getGradeProgressDistribution() {
        String cacheKey = CACHE_PREFIX + "grade_progress";
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> cached = (List<Map<String, Object>>) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        List<Object[]> gradeDist = enrollmentRepository.countByGrade();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Object[] row : gradeDist) {
            Map<String, Object> item = new LinkedHashMap<>();
            String grade = (String) row[0];
            Long count = ((Number) row[1]).longValue();
            item.put("grade", grade);
            item.put("count", count.intValue());

            List<StudentEnrollment> students = enrollmentRepository
                    .findByGrade(grade);

            double avgCompletion = 0;
            long lowCount = 0;
            if (!students.isEmpty()) {
                avgCompletion = students.stream()
                        .mapToDouble(s -> s.getCompletionRate() != null ? s.getCompletionRate().doubleValue() : 0)
                        .average()
                        .orElse(0);
                lowCount = students.stream()
                        .filter(s -> s.getCompletionRate() != null && s.getCompletionRate().compareTo(BigDecimal.valueOf(60)) < 0)
                        .count();
            }

            item.put("avgCompletion", avgCompletion);
            item.put("lowCount", lowCount);
            item.put("lowPercent", count > 0 ? (lowCount * 100.0 / count) : 0);

            result.add(item);
        }

        redisTemplate.opsForValue().set(cacheKey, result, CACHE_EXPIRE, TimeUnit.SECONDS);
        return result;
    }
}
