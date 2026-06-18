package com.secondhand.funnel.service;

import com.secondhand.funnel.dto.ShareLinkCreateDTO;
import com.secondhand.funnel.entity.ShareLink;
import com.secondhand.funnel.enums.UserRole;

import java.util.List;

public interface ShareLinkService {
    ShareLink create(ShareLinkCreateDTO dto);
    ShareLink getByToken(String token);
    ShareLink validateAndAccess(String token, UserRole userRole);
    ShareLink getById(Long id);
    List<ShareLink> listAll();
    void delete(Long id);
    void incrementViewCount(Long id);
}
