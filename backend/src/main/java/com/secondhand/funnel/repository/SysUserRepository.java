package com.secondhand.funnel.repository;

import com.secondhand.funnel.entity.SysUser;
import com.secondhand.funnel.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SysUserRepository extends JpaRepository<SysUser, Long> {
    Optional<SysUser> findByUsername(String username);
    List<SysUser> findByRole(UserRole role);
    List<SysUser> findByStoreId(Long storeId);
}
