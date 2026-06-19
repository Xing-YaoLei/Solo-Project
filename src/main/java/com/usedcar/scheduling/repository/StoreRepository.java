package com.usedcar.scheduling.repository;

import com.usedcar.scheduling.domain.Store;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StoreRepository extends JpaRepository<Store, Long> {

    List<Store> findByNameContaining(String keyword);
}
