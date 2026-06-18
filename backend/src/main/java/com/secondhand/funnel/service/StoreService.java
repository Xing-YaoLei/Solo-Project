package com.secondhand.funnel.service;

import com.secondhand.funnel.entity.Store;

import java.util.List;

public interface StoreService {
    Store create(Store store);
    Store getById(Long id);
    Store getByIdWithCache(Long id);
    List<Store> listAll();
    List<Store> listAllWithCache();
    Store update(Long id, Store store);
    void delete(Long id);
    void evictCache();
}
