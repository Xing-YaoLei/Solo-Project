package com.training.renewal.repository;

import com.training.renewal.entity.SysUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SysUserRepository extends JpaRepository<SysUser, Long> {

    Optional<SysUser> findByUsername(String username);

    List<SysUser> findByRole(String role);

    List<SysUser> findByStatus(String status);

    boolean existsByUsername(String username);
}
