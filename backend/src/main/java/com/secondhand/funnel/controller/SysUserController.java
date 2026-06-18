package com.secondhand.funnel.controller;

import com.secondhand.funnel.common.Result;
import com.secondhand.funnel.entity.SysUser;
import com.secondhand.funnel.enums.UserRole;
import com.secondhand.funnel.service.SysUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class SysUserController {

    private final SysUserService sysUserService;

    @PostMapping
    public Result<SysUser> create(@Valid @RequestBody SysUser user) {
        return Result.success(sysUserService.create(user));
    }

    @GetMapping("/{id}")
    public Result<SysUser> getById(@PathVariable Long id) {
        return Result.success(sysUserService.getById(id));
    }

    @GetMapping
    public Result<List<SysUser>> listAll() {
        return Result.success(sysUserService.listAll());
    }

    @GetMapping("/username/{username}")
    public Result<SysUser> getByUsername(@PathVariable String username) {
        return Result.success(sysUserService.getByUsername(username));
    }

    @GetMapping("/role/{role}")
    public Result<List<SysUser>> getByRole(@PathVariable UserRole role) {
        return Result.success(sysUserService.getByRole(role));
    }

    @GetMapping("/store/{storeId}")
    public Result<List<SysUser>> getByStoreId(@PathVariable Long storeId) {
        return Result.success(sysUserService.getByStoreId(storeId));
    }

    @PutMapping("/{id}")
    public Result<SysUser> update(@PathVariable Long id, @Valid @RequestBody SysUser user) {
        return Result.success(sysUserService.update(id, user));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        sysUserService.delete(id);
        return Result.success();
    }
}
