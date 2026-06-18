package com.secondhand.funnel.controller;

import com.secondhand.funnel.common.Result;
import com.secondhand.funnel.entity.SysUser;
import com.secondhand.funnel.enums.UserRole;
import com.secondhand.funnel.repository.SysUserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final SysUserRepository sysUserRepository;
    private static final Map<String, SysUser> TOKEN_STORE = new HashMap<>();

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody LoginRequest request) {
        SysUser user = sysUserRepository.findByUsername(request.getUsername())
                .orElseGet(() -> getMockUser(request.getUsername()));
        String token = UUID.randomUUID().toString().replace("-", "");
        TOKEN_STORE.put(token, user);

        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("id", user.getId());
        data.put("username", user.getUsername());
        data.put("name", user.getRealName());
        data.put("role", mapRole(user.getRole()));
        data.put("avatar", "");
        data.put("department", getDept(user.getRole()));
        data.put("storeId", user.getStoreId());
        return Result.success(data);
    }

    @PostMapping("/logout")
    public Result<Void> logout(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (auth != null && auth.startsWith("Bearer ")) {
            TOKEN_STORE.remove(auth.substring(7));
        }
        return Result.success();
    }

    @GetMapping("/userinfo")
    public Result<Map<String, Object>> getUserInfo(@RequestHeader(value = "Authorization", required = false) String auth) {
        SysUser user = null;
        if (auth != null && auth.startsWith("Bearer ")) {
            user = TOKEN_STORE.get(auth.substring(7));
        }
        if (user == null) {
            user = getMockUser("manager");
        }
        Map<String, Object> data = new HashMap<>();
        data.put("id", user.getId());
        data.put("username", user.getUsername());
        data.put("name", user.getRealName());
        data.put("role", mapRole(user.getRole()));
        data.put("avatar", "");
        data.put("department", getDept(user.getRole()));
        data.put("storeId", user.getStoreId());
        return Result.success(data);
    }

    private String mapRole(UserRole role) {
        if (role == null) return "operator";
        switch (role) {
            case STORE_MANAGER: return "manager";
            case ASSESSOR: return "operator";
            case SALES: return "operator";
            case FINANCE_STAFF: return "finance";
            case EXTERNAL: return "external";
            default: return "admin";
        }
    }

    private String getDept(UserRole role) {
        if (role == null) return "运营部";
        switch (role) {
            case FINANCE_STAFF: return "金融部";
            case EXTERNAL: return "外部";
            case STORE_MANAGER: return "管理层";
            default: return "运营部";
        }
    }

    private SysUser getMockUser(String username) {
        SysUser u = new SysUser();
        switch (username == null ? "" : username) {
            case "admin":
                u.setId(1L); u.setUsername("admin"); u.setRealName("系统管理员");
                u.setRole(UserRole.STORE_MANAGER); u.setStoreId(1L); break;
            case "finance":
                u.setId(7L); u.setUsername("finance"); u.setRealName("周金融");
                u.setRole(UserRole.FINANCE_STAFF); u.setStoreId(1L); break;
            case "external":
                u.setId(8L); u.setUsername("external"); u.setRealName("外部合作方");
                u.setRole(UserRole.EXTERNAL); u.setStoreId(null); break;
            case "operator":
            default:
                u.setId(3L); u.setUsername("operator"); u.setRealName("李运营");
                u.setRole(UserRole.ASSESSOR); u.setStoreId(1L); break;
        }
        return u;
    }

    @Data
    public static class LoginRequest {
        private String username;
        private String password;
    }
}
