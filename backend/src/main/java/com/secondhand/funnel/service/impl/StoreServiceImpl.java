package com.secondhand.funnel.service.impl;

import com.secondhand.funnel.entity.Store;
import com.secondhand.funnel.exception.BusinessException;
import com.secondhand.funnel.repository.StoreRepository;
import com.secondhand.funnel.service.StoreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class StoreServiceImpl implements StoreService {

    private static final String CACHE_KEY_STORE = "store:detail:";
    private static final String CACHE_KEY_STORE_LIST = "store:list:all";
    private static final long CACHE_TTL_MINUTES = 60;

    private final StoreRepository storeRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    @Transactional
    public Store create(Store store) {
        if (store.getId() != null) {
            store.setId(null);
        }
        Store saved = storeRepository.save(store);
        evictCache();
        log.info("创建门店成功: id={}, name={}", saved.getId(), saved.getStoreName());
        return saved;
    }

    @Override
    public Store getById(Long id) {
        return storeRepository.findById(id)
                .orElseThrow(() -> new BusinessException("门店不存在: " + id));
    }

    @Override
    @SuppressWarnings("unchecked")
    public Store getByIdWithCache(Long id) {
        String cacheKey = CACHE_KEY_STORE + id;
        try {
            Object cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                return (Store) cached;
            }
        } catch (Exception e) {
            log.warn("读取Redis缓存失败: {}", e.getMessage());
        }

        Store store = getById(id);
        try {
            redisTemplate.opsForValue().set(cacheKey, store, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.warn("写入Redis缓存失败: {}", e.getMessage());
        }
        return store;
    }

    @Override
    public List<Store> listAll() {
        return storeRepository.findAll();
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<Store> listAllWithCache() {
        try {
            Object cached = redisTemplate.opsForValue().get(CACHE_KEY_STORE_LIST);
            if (cached != null) {
                return (List<Store>) cached;
            }
        } catch (Exception e) {
            log.warn("读取Redis缓存失败: {}", e.getMessage());
        }

        List<Store> stores = listAll();
        try {
            redisTemplate.opsForValue().set(CACHE_KEY_STORE_LIST, stores, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.warn("写入Redis缓存失败: {}", e.getMessage());
        }
        return stores;
    }

    @Override
    @Transactional
    public Store update(Long id, Store store) {
        Store existing = getById(id);
        existing.setStoreName(store.getStoreName());
        existing.setAddress(store.getAddress());
        existing.setManagerId(store.getManagerId());
        Store updated = storeRepository.save(existing);
        evictCache();
        log.info("更新门店成功: id={}", id);
        return updated;
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!storeRepository.existsById(id)) {
            throw new BusinessException("门店不存在: " + id);
        }
        storeRepository.deleteById(id);
        evictCache();
        log.info("删除门店成功: id={}", id);
    }

    @Override
    public void evictCache() {
        try {
            List<String> cacheKeys = Collections.list(
                    redisTemplate.keys(CACHE_KEY_STORE + "*")
            );
            cacheKeys.add(CACHE_KEY_STORE_LIST);
            redisTemplate.delete(cacheKeys);
        } catch (Exception e) {
            log.warn("清除Redis缓存失败: {}", e.getMessage());
        }
    }
}
