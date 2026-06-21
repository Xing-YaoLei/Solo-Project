package com.usedcar.acquisition.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.usedcar.acquisition.entity.SysUser;
import com.usedcar.acquisition.mapper.SysUserMapper;
import com.usedcar.acquisition.service.SysUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SysUserServiceImpl implements SysUserService {

    private final SysUserMapper userMapper;

    @Override
    @Cacheable(value = "sysUser", key = "'all'")
    public List<SysUser> listAll() {
        return userMapper.selectList(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getStatus, 1)
                .orderByAsc(SysUser::getId));
    }

    @Override
    @Cacheable(value = "sysUser", key = "'role:' + #role")
    public List<SysUser> listByRole(String role) {
        return userMapper.selectList(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getStatus, 1)
                .eq(SysUser::getRole, role)
                .orderByAsc(SysUser::getId));
    }

    @Override
    @Cacheable(value = "sysUser", key = "'id:' + #id")
    public SysUser getById(Long id) {
        if (id == null) return null;
        return userMapper.selectById(id);
    }
}
