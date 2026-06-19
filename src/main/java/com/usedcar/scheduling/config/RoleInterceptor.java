package com.usedcar.scheduling.config;

import com.usedcar.scheduling.enums.UserRole;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class RoleInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String roleHeader = request.getHeader("X-User-Role");

        if (roleHeader == null) {
            return true;
        }

        try {
            UserRole.valueOf(roleHeader);
        } catch (IllegalArgumentException e) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Invalid role: " + roleHeader);
            return false;
        }

        return true;
    }
}
