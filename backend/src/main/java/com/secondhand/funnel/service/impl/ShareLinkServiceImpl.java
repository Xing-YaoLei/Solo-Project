package com.secondhand.funnel.service.impl;

import com.secondhand.funnel.dto.ShareLinkCreateDTO;
import com.secondhand.funnel.entity.SysUser;
import com.secondhand.funnel.entity.ShareLink;
import com.secondhand.funnel.enums.UserRole;
import com.secondhand.funnel.exception.BusinessException;
import com.secondhand.funnel.repository.SysUserRepository;
import com.secondhand.funnel.repository.ShareLinkRepository;
import com.secondhand.funnel.service.ShareLinkService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShareLinkServiceImpl implements ShareLinkService {

    private final ShareLinkRepository shareLinkRepository;
    private final SysUserRepository sysUserRepository;

    @Override
    @Transactional
    public ShareLink create(ShareLinkCreateDTO dto) {
        SysUser creator = sysUserRepository.findById(dto.getCreatedBy())
                .orElseThrow(() -> new BusinessException("创建用户不存在: " + dto.getCreatedBy()));

        if (dto.getExpireAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("过期时间不能早于当前时间");
        }

        ShareLink shareLink = new ShareLink();
        shareLink.setLinkToken(generateToken());
        shareLink.setCreatedBy(dto.getCreatedBy());
        if (dto.getRoleScope() != null && !dto.getRoleScope().isEmpty()) {
            String roleScope = dto.getRoleScope().stream()
                    .map(Enum::name)
                    .collect(Collectors.joining(","));
            shareLink.setRoleScope(roleScope);
        }
        shareLink.setExpireAt(dto.getExpireAt());
        shareLink.setViewCount(0);
        shareLink.setIncludeSensitive(Boolean.TRUE.equals(dto.getIncludeSensitive()));

        ShareLink saved = shareLinkRepository.save(shareLink);
        log.info("创建分享链接成功: id={}, token={}", saved.getId(), saved.getLinkToken());
        return saved;
    }

    @Override
    public ShareLink getByToken(String token) {
        return shareLinkRepository.findByLinkToken(token)
                .orElseThrow(() -> new BusinessException("分享链接不存在: " + token));
    }

    @Override
    @Transactional
    public ShareLink validateAndAccess(String token, UserRole userRole) {
        ShareLink shareLink = shareLinkRepository.findValidByToken(token, LocalDateTime.now())
                .orElseThrow(() -> new BusinessException("分享链接不存在或已过期"));

        String roleScope = shareLink.getRoleScope();
        if (roleScope != null && !roleScope.trim().isEmpty() && userRole != null) {
            boolean hasPermission = false;
            String[] roles = roleScope.split(",");
            for (String role : roles) {
                if (role.trim().equals(userRole.name())) {
                    hasPermission = true;
                    break;
                }
            }
            if (!hasPermission) {
                throw new BusinessException(403, "您没有权限访问此分享链接");
            }
        }

        incrementViewCount(shareLink.getId());
        log.info("访问分享链接成功: token={}, viewCount={}", token, shareLink.getViewCount() + 1);

        return shareLinkRepository.findById(shareLink.getId()).orElse(shareLink);
    }

    @Override
    public ShareLink getById(Long id) {
        return shareLinkRepository.findById(id)
                .orElseThrow(() -> new BusinessException("分享链接不存在: " + id));
    }

    @Override
    public List<ShareLink> listAll() {
        return shareLinkRepository.findAll();
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!shareLinkRepository.existsById(id)) {
            shareLinkRepository.deleteById(id);
            log.info("删除分享链接成功: id={}", id);
        }
    }

    @Override
    @Transactional
    public void incrementViewCount(Long id) {
        shareLinkRepository.incrementViewCount(id);
    }

    private String generateToken() {
        return UUID.randomUUID().toString().replace("-", "")
                + System.currentTimeMillis();
    }
}
