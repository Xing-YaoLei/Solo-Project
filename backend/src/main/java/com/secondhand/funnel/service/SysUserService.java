package com.secondhand.funnel.service;

import com.secondhand.funnel.entity.SysUser;
import com.secondhand.funnel.enums.UserRole;

import java.util.List;

public interface SysUserService {
    SysUser create(SysUser user);
    SysUser getById(Long id);
    SysUser getByUsername(String username);
    List<SysUser> listAll();
    List<SysUser> getByRole(UserRole role);
    List<SysUser> getByStoreId(Long storeId);
    SysUser update(Long id, SysUser user);
    void delete(Long id);
}
