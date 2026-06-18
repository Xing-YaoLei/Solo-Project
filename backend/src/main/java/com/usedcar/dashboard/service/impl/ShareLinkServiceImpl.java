package com.usedcar.dashboard.service.impl;

import com.usedcar.dashboard.dto.DashboardFilter;
import com.usedcar.dashboard.dto.ShareLink;
import com.usedcar.dashboard.dto.ShareLinkValidation;
import com.usedcar.dashboard.entity.FilterView;
import com.usedcar.dashboard.mapper.FilterViewMapper;
import com.usedcar.dashboard.mapper.ShareLinkMapper;
import com.usedcar.dashboard.service.ShareLinkService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShareLinkServiceImpl implements ShareLinkService {

    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String SHARE_CACHE_PREFIX = "dashboard:share:";
    private static final long SHARE_CACHE_HOURS = 1;

    private final ShareLinkMapper shareLinkMapper;
    private final FilterViewMapper filterViewMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${dashboard.share.base-url:}")
    private String baseUrl;

    private String generateToken() {
        String uuid = UUID.randomUUID().toString().replace("-", "");
        byte[] randomBytes = new byte[8];
        SECURE_RANDOM.nextBytes(randomBytes);
        StringBuilder sb = new StringBuilder(uuid);
        for (byte b : randomBytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private String buildShareUrl(String token) {
        if (baseUrl != null && !baseUrl.isBlank()) {
            return baseUrl.endsWith("/") ? baseUrl + "share/" + token : baseUrl + "/share/" + token;
        }
        return "/share/" + token;
    }

    @SuppressWarnings("unchecked")
    private <T> T getFromCache(String key) {
        try {
            return (T) redisTemplate.opsForValue().get(key);
        } catch (Exception e) {
            log.warn("Failed to read share link from cache: {}", key, e);
            return null;
        }
    }

    private void putToCache(String key, Object value) {
        try {
            redisTemplate.opsForValue().set(key, value, SHARE_CACHE_HOURS, TimeUnit.HOURS);
        } catch (Exception e) {
            log.warn("Failed to write share link to cache: {}", key, e);
        }
    }

    private void evictCache(String token) {
        try {
            redisTemplate.delete(SHARE_CACHE_PREFIX + token);
        } catch (Exception e) {
            log.warn("Failed to evict share link cache: {}", token, e);
        }
    }

    private DashboardFilter resolveFiltersFromView(String viewId, DashboardFilter filter) {
        if (viewId != null && !viewId.isBlank()) {
            FilterView savedView = filterViewMapper.selectByViewId(viewId);
            if (savedView != null && savedView.getFiltersJson() != null) {
                DashboardFilter resolved = savedView.getFiltersJson();
                resolved.setViewId(viewId);
                return resolved;
            }
        }
        return filter;
    }

    @Override
    @Transactional
    public ShareLink createShareLink(List<String> permissions, boolean includesTurnoverMetrics,
                                     DashboardFilter filter, String viewId) {
        String token = generateToken();
        DashboardFilter effectiveFilter = resolveFiltersFromView(viewId, filter);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusDays(7);

        com.usedcar.dashboard.entity.ShareLink entity = com.usedcar.dashboard.entity.ShareLink.builder()
                .token(token)
                .viewId(viewId)
                .filtersJson(effectiveFilter)
                .permissionsJson(permissions)
                .creator("system")
                .includesTurnoverMetrics(includesTurnoverMetrics ? 1 : 0)
                .isValid(1)
                .createdAt(now)
                .expiresAt(expiresAt)
                .revokedAt(null)
                .build();

        shareLinkMapper.insert(entity);

        ShareLink dto = ShareLink.builder()
                .token(token)
                .url(buildShareUrl(token))
                .expiresAt(expiresAt.format(DATETIME_FORMATTER))
                .permissions(permissions)
                .includesTurnoverMetrics(includesTurnoverMetrics)
                .build();

        putToCache(SHARE_CACHE_PREFIX + token, dto);
        return dto;
    }

    @Override
    public ShareLinkValidation validateShareLink(String token) {
        if (token == null || token.isBlank()) {
            return ShareLinkValidation.builder()
                    .valid(false)
                    .build();
        }

        String cacheKey = SHARE_CACHE_PREFIX + "validation:" + token;
        ShareLinkValidation cachedValidation = getFromCache(cacheKey);
        if (cachedValidation != null) {
            return cachedValidation;
        }

        com.usedcar.dashboard.entity.ShareLink entity = shareLinkMapper.selectByToken(token);

        if (entity == null) {
            ShareLinkValidation invalid = ShareLinkValidation.builder()
                    .valid(false)
                    .build();
            putToCache(cacheKey, invalid);
            return invalid;
        }

        LocalDateTime now = LocalDateTime.now();
        if (entity.getExpiresAt() != null && entity.getExpiresAt().isBefore(now)) {
            ShareLinkValidation invalid = ShareLinkValidation.builder()
                    .valid(false)
                    .build();
            putToCache(cacheKey, invalid);
            return invalid;
        }

        if (entity.getIsValid() == null || entity.getIsValid() != 1) {
            ShareLinkValidation invalid = ShareLinkValidation.builder()
                    .valid(false)
                    .build();
            putToCache(cacheKey, invalid);
            return invalid;
        }

        DashboardFilter filters = entity.getFiltersJson();
        if (filters != null && entity.getViewId() != null) {
            filters.setViewId(entity.getViewId());
        }

        ShareLinkValidation validation = ShareLinkValidation.builder()
                .valid(true)
                .permissions(entity.getPermissionsJson())
                .includesTurnoverMetrics(entity.getIncludesTurnoverMetrics() != null && entity.getIncludesTurnoverMetrics() == 1)
                .filters(filters)
                .expiresAt(entity.getExpiresAt() != null ? entity.getExpiresAt().format(DATETIME_FORMATTER) : null)
                .build();

        putToCache(cacheKey, validation);
        return validation;
    }
}
