package com.usedcar.dashboard.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("Content-Disposition", "X-Total-Count")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new ShareTokenInterceptor())
                .addPathPatterns("/api/dashboard/**")
                .excludePathPatterns(
                        "/api/dashboard/share-links/*",
                        "/api/dashboard/export/*"
                )
                .order(0);
    }

    @Slf4j
    public static class ShareTokenInterceptor implements HandlerInterceptor {
        @Override
        public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
            String shareToken = request.getHeader("X-Share-Token");
            if (shareToken != null && !shareToken.isBlank()) {
                request.setAttribute("SHARE_TOKEN", shareToken);
                log.debug("Share token detected: {}", shareToken.substring(0, Math.min(12, shareToken.length())));
            }
            return true;
        }
    }
}
