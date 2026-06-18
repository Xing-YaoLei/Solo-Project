package com.secondhand.funnel.repository;

import com.secondhand.funnel.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoreRepository extends JpaRepository<Store, Long> {
    List<Store> findByManagerId(Long managerId);
    Store findByStoreName(String storeName);
}
