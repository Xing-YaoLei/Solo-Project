package com.usedcar.dashboard.service.impl;

import com.usedcar.dashboard.dto.DashboardFilter;
import com.usedcar.dashboard.dto.FilterView;
import com.usedcar.dashboard.mapper.FilterViewMapper;
import com.usedcar.dashboard.service.FilterViewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FilterViewServiceImpl implements FilterViewService {

    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final FilterViewMapper filterViewMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    private FilterView toDto(com.usedcar.dashboard.entity.FilterView entity) {
        if (entity == null) {
            return null;
        }
        DashboardFilter filters = entity.getFiltersJson();
        if (filters != null) {
            filters.setViewId(entity.getViewId());
        }
        return FilterView.builder()
                .id(entity.getId())
                .viewId(entity.getViewId())
                .name(entity.getName())
                .isDefault(entity.getIsDefault() != null && entity.getIsDefault() == 1)
                .filters(filters)
                .createdAt(entity.getCreatedAt() != null ? entity.getCreatedAt().format(DATETIME_FORMATTER) : null)
                .updatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().format(DATETIME_FORMATTER) : null)
                .build();
    }

    private com.usedcar.dashboard.entity.FilterView toEntity(FilterView dto) {
        if (dto == null) {
            return null;
        }
        DashboardFilter filters = dto.getFilters();
        if (filters != null) {
            filters.setViewId(dto.getViewId());
        }
        return com.usedcar.dashboard.entity.FilterView.builder()
                .id(dto.getId())
                .viewId(dto.getViewId())
                .name(dto.getName())
                .isDefault(Boolean.TRUE.equals(dto.getIsDefault()) ? 1 : 0)
                .filtersJson(filters)
                .build();
    }

    private void evictDashboardCache() {
        try {
            Set<String> keys = redisTemplate.keys("dashboard:*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.info("Evicted {} dashboard cache entries", keys.size());
            }
        } catch (Exception e) {
            log.warn("Failed to evict dashboard cache", e);
        }
    }

    @Override
    public List<FilterView> getAllViews() {
        List<com.usedcar.dashboard.entity.FilterView> entities = filterViewMapper.selectAll();
        return entities.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public FilterView getByViewId(String viewId) {
        com.usedcar.dashboard.entity.FilterView entity = filterViewMapper.selectByViewId(viewId);
        return toDto(entity);
    }

    @Override
    public FilterView getDefaultView() {
        com.usedcar.dashboard.entity.FilterView entity = filterViewMapper.selectDefault();
        return toDto(entity);
    }

    @Override
    @Transactional
    public FilterView createView(FilterView view) {
        com.usedcar.dashboard.entity.FilterView entity = toEntity(view);
        if (entity.getViewId() == null || entity.getViewId().isBlank()) {
            entity.setViewId(UUID.randomUUID().toString().replace("-", ""));
        }
        if (entity.getIsDefault() == null) {
            entity.setIsDefault(0);
        }
        if (Boolean.TRUE.equals(view.getIsDefault())) {
            filterViewMapper.resetAllDefault();
            entity.setIsDefault(1);
        }
        LocalDateTime now = LocalDateTime.now();
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        entity.setCreator("system");

        filterViewMapper.insert(entity);
        evictDashboardCache();

        return toDto(entity);
    }

    @Override
    @Transactional
    public FilterView updateView(FilterView view) {
        com.usedcar.dashboard.entity.FilterView entity = toEntity(view);
        entity.setUpdatedAt(LocalDateTime.now());
        filterViewMapper.update(entity);
        evictDashboardCache();
        return getByViewId(view.getViewId());
    }

    @Override
    @Transactional
    public void deleteView(Long id) {
        filterViewMapper.deleteById(id);
        evictDashboardCache();
    }

    @Override
    @Transactional
    public void setDefault(String viewId) {
        filterViewMapper.resetAllDefault();
        com.usedcar.dashboard.entity.FilterView view = filterViewMapper.selectByViewId(viewId);
        if (view != null) {
            view.setIsDefault(1);
            view.setUpdatedAt(LocalDateTime.now());
            filterViewMapper.update(view);
        }
        evictDashboardCache();
    }
}
