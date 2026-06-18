package com.secondhand.funnel.service.impl;

import com.secondhand.funnel.entity.SysUser;
import com.secondhand.funnel.enums.UserRole;
import com.secondhand.funnel.exception.BusinessException;
import com.secondhand.funnel.repository.SysUserRepository;
import com.secondhand.funnel.service.SysUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SysUserServiceImpl implements SysUserService {

    private final SysUserRepository sysUserRepository;

    @Override
    @Transactional
    public SysUser create(SysUser user) {
        if (user.getId() != null) {
            user.setId(null);
        }
        if (sysUserRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new BusinessException("用户名已存在: " + user.getUsername());
        }
        SysUser saved = sysUserRepository.save(user);
        log.info("创建用户成功: id={}, username={}", saved.getId(), saved.getUsername());
        return saved;
    }

    @Override
    public SysUser getById(Long id) {
        return sysUserRepository.findById(id)
                .orElseThrow(() -> new BusinessException("用户不存在: " + id));
    }

    @Override
    public SysUser getByUsername(String username) {
        return sysUserRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("用户不存在: " + username));
    }

    @Override
    public List<SysUser> listAll() {
        return sysUserRepository.findAll();
    }

    @Override
    public List<SysUser> getByRole(UserRole role) {
        return sysUserRepository.findByRole(role);
    }

    @Override
    public List<SysUser> getByStoreId(Long storeId) {
        return sysUserRepository.findByStoreId(storeId);
    }

    @Override
    @Transactional
    public SysUser update(Long id, SysUser user) {
        SysUser existing = getById(id);
        existing.setUsername(user.getUsername());
        existing.setPassword(user.getPassword());
        existing.setRealName(user.getRealName());
        existing.setRole(user.getRole());
        existing.setStoreId(user.getStoreId());
        SysUser updated = sysUserRepository.save(existing);
        log.info("更新用户成功: id={}", id);
        return updated;
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!sysUserRepository.existsById(id)) {
            throw new BusinessException("用户不存在: " + id);
        }
        sysUserRepository.deleteById(id);
        log.info("删除用户成功: id={}", id);
    }
}
