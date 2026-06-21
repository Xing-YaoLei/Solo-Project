package com.usedcar.acquisition.controller;

import com.usedcar.acquisition.common.Result;
import com.usedcar.acquisition.entity.SysUser;
import com.usedcar.acquisition.service.SysUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class SysUserController {

    private final SysUserService userService;

    @GetMapping("/list")
    public Result<List<SysUser>> listAll() {
        return Result.success(userService.listAll());
    }

    @GetMapping("/list-by-role")
    public Result<List<SysUser>> listByRole(@RequestParam String role) {
        return Result.success(userService.listByRole(role));
    }

    @GetMapping("/{id}")
    public Result<SysUser> getById(@PathVariable Long id) {
        return Result.success(userService.getById(id));
    }
}
