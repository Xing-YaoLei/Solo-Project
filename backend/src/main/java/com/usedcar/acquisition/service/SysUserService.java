package com.usedcar.acquisition.service;

import com.usedcar.acquisition.entity.SysUser;
import java.util.List;

public interface SysUserService {
    List<SysUser> listAll();
    List<SysUser> listByRole(String role);
    SysUser getById(Long id);
}
