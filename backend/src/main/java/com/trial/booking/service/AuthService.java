package com.trial.booking.service;

import com.trial.booking.dto.LoginRequest;
import com.trial.booking.dto.LoginResponse;
import com.trial.booking.entity.User;
import com.trial.booking.repository.UserRepository;
import com.trial.booking.security.JwtTokenProvider;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("用户不存在"));

        if (!user.getEnabled()) {
            throw new BadCredentialsException("账号已被禁用");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("密码错误");
        }

        if (request.getRole() != null && !request.getRole().isEmpty()
                && !request.getRole().equals(user.getRole())) {
            throw new BadCredentialsException("角色不匹配");
        }

        String token = jwtTokenProvider.generateToken(user.getId(), user.getUsername(), user.getRole());

        LoginResponse.UserInfo userInfo = new LoginResponse.UserInfo(
                user.getId(),
                user.getUsername(),
                user.getRealName(),
                user.getRole(),
                user.getCampus()
        );

        return new LoginResponse(token, userInfo);
    }

    public LoginResponse.UserInfo getUserInfo(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("用户不存在"));
        return new LoginResponse.UserInfo(
                user.getId(),
                user.getUsername(),
                user.getRealName(),
                user.getRole(),
                user.getCampus()
        );
    }
}
