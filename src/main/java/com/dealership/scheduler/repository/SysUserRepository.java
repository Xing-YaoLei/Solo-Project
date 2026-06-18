package com.dealership.scheduler.repository;

import com.dealership.scheduler.entity.SysUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SysUserRepository extends JpaRepository<SysUser, Long> {
    Optional<SysUser> findByUsername(String username);
    List<SysUser> findByRole(SysUser.Role role);
    List<SysUser> findByEnabledTrue();
    List<SysUser> findByRoleInAndEnabledTrue(List<SysUser.Role> roles);
}
