package com.trial.booking.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collection;

public class SecurityUtils {

    public static Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long) {
            return (Long) authentication.getPrincipal();
        }
        return null;
    }

    public static String getCurrentUserRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null) {
            Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
            for (GrantedAuthority authority : authorities) {
                String role = authority.getAuthority();
                if (role.startsWith("ROLE_")) {
                    return role.substring(5);
                }
            }
        }
        return null;
    }

    public static boolean hasRole(String role) {
        String currentRole = getCurrentUserRole();
        return role.equals(currentRole);
    }

    public static boolean hasAnyRole(String... roles) {
        String currentRole = getCurrentUserRole();
        for (String role : roles) {
            if (role.equals(currentRole)) {
                return true;
            }
        }
        return false;
    }
}
