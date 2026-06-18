package com.secondhand.funnel.controller;

import com.secondhand.funnel.common.Result;
import com.secondhand.funnel.dto.ShareLinkCreateDTO;
import com.secondhand.funnel.entity.ShareLink;
import com.secondhand.funnel.enums.UserRole;
import com.secondhand.funnel.service.ShareLinkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/share-links")
@RequiredArgsConstructor
public class ShareLinkController {

    private final ShareLinkService shareLinkService;

    @PostMapping
    public Result<ShareLink> create(@Valid @RequestBody ShareLinkCreateDTO dto) {
        return Result.success(shareLinkService.create(dto));
    }

    @GetMapping("/{id}")
    public Result<ShareLink> getById(@PathVariable Long id) {
        return Result.success(shareLinkService.getById(id));
    }

    @GetMapping
    public Result<List<ShareLink>> listAll() {
        return Result.success(shareLinkService.listAll());
    }

    @GetMapping("/token/{token}")
    public Result<ShareLink> getByToken(@PathVariable String token) {
        return Result.success(shareLinkService.getByToken(token));
    }

    @GetMapping("/token/{token}/access")
    public Result<ShareLink> validateAndAccess(
            @PathVariable String token,
            @RequestParam(required = false) UserRole userRole) {
        return Result.success(shareLinkService.validateAndAccess(token, userRole));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        shareLinkService.delete(id);
        return Result.success();
    }
}
