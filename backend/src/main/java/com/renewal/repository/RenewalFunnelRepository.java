package com.renewal.repository;

import com.renewal.entity.RenewalFunnel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RenewalFunnelRepository extends JpaRepository<RenewalFunnel, Long> {
}
