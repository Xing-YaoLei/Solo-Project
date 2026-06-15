package com.trial.booking.controller;

import com.trial.booking.common.ApiResponse;
import com.trial.booking.dto.LoginRequest;
import com.trial.booking.dto.LoginResponse;
import com.trial.booking.security.SecurityUtils;
import com.trial.booking.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success(authService.login(request));
    }

    @GetMapping("/user-info")
    public ApiResponse<LoginResponse.UserInfo> getUserInfo() {
        Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.success(authService.getUserInfo(userId));
    }
}
