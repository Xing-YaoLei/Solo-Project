package com.training.renewal.service;

import com.training.renewal.entity.ProgressComment;
import com.training.renewal.repository.ProgressCommentRepository;
import com.training.renewal.repository.StudentEnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final ProgressCommentRepository commentRepository;
    private final StudentEnrollmentRepository enrollmentRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CACHE_PREFIX = "comment:";
    private static final long CACHE_EXPIRE = 1800;

    @Transactional
    public ProgressComment createComment(ProgressComment comment) {
        if (comment.getStatus() == null) {
            comment.setStatus("PENDING");
        }
        if (comment.getRiskLevel() == null) {
            comment.setRiskLevel("MEDIUM");
        }

        enrollmentRepository.findByStudentNo(comment.getStudentNo())
                .ifPresent(student -> {
                    comment.setStudentName(student.getStudentName());
                    if (comment.getConsultantId() == null) {
                        comment.setConsultantId(student.getConsultantId());
                        comment.setConsultantName(student.getConsultantName());
                    }
                });

        ProgressComment saved = commentRepository.save(comment);
        evictCommentCache(comment.getStudentNo(), comment.getConsultantId());
        return saved;
    }

    @Transactional
    public ProgressComment updateComment(Long id, ProgressComment comment) {
        ProgressComment existing = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("评论不存在"));

        if (comment.getContent() != null) existing.setContent(comment.getContent());
        if (comment.getCommentType() != null) existing.setCommentType(comment.getCommentType());
        if (comment.getRiskLevel() != null) existing.setRiskLevel(comment.getRiskLevel());
        if (comment.getFollowUpPlan() != null) existing.setFollowUpPlan(comment.getFollowUpPlan());
        if (comment.getFollowUpTime() != null) existing.setFollowUpTime(comment.getFollowUpTime());
        if (comment.getStatus() != null) existing.setStatus(comment.getStatus());

        ProgressComment saved = commentRepository.save(existing);
        evictCommentCache(existing.getStudentNo(), existing.getConsultantId());
        return saved;
    }

    public List<ProgressComment> getCommentsByStudent(String studentNo) {
        String cacheKey = CACHE_PREFIX + "student:" + studentNo;
        @SuppressWarnings("unchecked")
        List<ProgressComment> cached = (List<ProgressComment>) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        List<ProgressComment> comments = commentRepository.findByStudentNoOrderByCreateTimeDesc(studentNo);
        redisTemplate.opsForValue().set(cacheKey, comments, CACHE_EXPIRE, TimeUnit.SECONDS);
        return comments;
    }

    public List<ProgressComment> getCommentsByConsultant(String consultantId) {
        String cacheKey = CACHE_PREFIX + "consultant:" + consultantId;
        @SuppressWarnings("unchecked")
        List<ProgressComment> cached = (List<ProgressComment>) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        List<ProgressComment> comments = commentRepository.findByConsultantIdOrderByCreateTimeDesc(consultantId);
        redisTemplate.opsForValue().set(cacheKey, comments, CACHE_EXPIRE, TimeUnit.SECONDS);
        return comments;
    }

    public List<Map<String, Object>> getRiskLevelDistribution() {
        List<Object[]> raw = commentRepository.getRiskLevelDistribution();
        return raw.stream().map(arr -> Map.of(
                "level", arr[0],
                "count", arr[1]
        )).toList();
    }

    public List<ProgressComment> getPendingFollowUps() {
        return commentRepository.findByStatusOrderByFollowUpTimeAsc("PENDING");
    }

    public List<Map<String, Object>> getCommentStatsByConsultant() {
        List<Object[]> raw = commentRepository.getCommentStatsByConsultant();
        return raw.stream().map(arr -> {
            Map<String, Object> item = new java.util.LinkedHashMap<>();
            item.put("consultantId", arr[0]);
            item.put("consultantName", arr[1]);
            item.put("commentCount", arr[2]);
            return item;
        }).toList();
    }

    private void evictCommentCache(String studentNo, String consultantId) {
        redisTemplate.delete(CACHE_PREFIX + "student:" + studentNo);
        if (consultantId != null) {
            redisTemplate.delete(CACHE_PREFIX + "consultant:" + consultantId);
        }
    }
}
