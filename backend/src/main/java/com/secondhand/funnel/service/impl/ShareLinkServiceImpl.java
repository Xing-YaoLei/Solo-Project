package com.secondhand.funnel.service.impl;

import com.secondhand.funnel.dto.ShareLinkCreateDTO;
import com.secondhand.funnel.entity.ShareLink;
import com.secondhand.funnel.enums.UserRole;
import com.secondhand.funnel.exception.BusinessException;
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

    @Override
    @Transactional
    public ShareLink create(ShareLinkCreateDTO dto) {
        ShareLink shareLink = new ShareLink();
        shareLink.setLinkToken(generateToken());

        Long createdBy = dto.getCreatedBy() != null ? dto.getCreatedBy() : 1L;
        shareLink.setCreatedBy(createdBy);

        if (dto.getRoleScope() != null && !dto.getRoleScope().isEmpty()) {
            String roleScope = dto.getRoleScope().stream()
                    .map(Enum::name)
                    .collect(Collectors.joining(","));
            shareLink.setRoleScope(roleScope);
        }

        LocalDateTime expireAt;
        if (dto.getValidDays() != null && dto.getValidDays() > 0) {
            if (dto.getValidDays() >= 90) {
                expireAt = LocalDateTime.now().plusYears(10);
            } else {
                expireAt = LocalDateTime.now().plusDays(dto.getValidDays());
            }
        } else {
            expireAt = LocalDateTime.now().plusDays(7);
        }
        if (expireAt.isBefore(LocalDateTime.now())) {
            throw new BusinessException("过期时间不能早于当前时间");
        }
        shareLink.setExpireAt(expireAt);
        shareLink.setViewCount(0);
        shareLink.setIncludeSensitive(Boolean.TRUE.equals(dto.getIncludeSensitive()));

        ShareLink saved = shareLinkRepository.save(shareLink);
        log.info("创建分享链接成功: id={}, token={}, roleScope={}",
                saved.getId(), saved.getLinkToken(), saved.getRoleScope());
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
            if (!hasPermission && userRole != UserRole.EXTERNAL) {
                throw new BusinessException(403, "您没有权限访问此分享链接");
            }
            if (!hasPermission && userRole == UserRole.EXTERNAL) {
                shareLink.setIncludeSensitive(false);
            }
        }

        incrementViewCount(shareLink.getId());
        log.info("访问分享链接成功: token={}, userRole={}", token, userRole);

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
        if (shareLinkRepository.existsById(id)) {
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
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16)
                + System.currentTimeMillis() % 10000;
    }
}
