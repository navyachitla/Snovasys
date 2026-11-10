package com.balancevault.controller;

import com.balancevault.dto.AuthDTOs.*;
import com.balancevault.entity.User;
import com.balancevault.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/auth/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req,
                                                HttpServletRequest servletRequest) {
        String clientIp = servletRequest.getRemoteAddr();
        AuthResponse response = authService.register(req, clientIp);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/auth/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req,
                                             HttpServletRequest servletRequest) {
        String clientIp = servletRequest.getRemoteAddr();
        AuthResponse response = authService.login(req, clientIp);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/auth/accept-invitation")
    public ResponseEntity<AuthResponse> acceptInvitation(@Valid @RequestBody AcceptInvitationRequest req,
                                                         HttpServletRequest servletRequest) {
        String clientIp = servletRequest.getRemoteAddr();
        AuthResponse response = authService.acceptInvitation(req, clientIp);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/auth/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@AuthenticationPrincipal User user,
                                                              @Valid @RequestBody ChangePasswordRequest req,
                                                              HttpServletRequest servletRequest) {
        String clientIp = servletRequest.getRemoteAddr();
        authService.changePassword(user, req, clientIp);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully."));
    }

    @GetMapping("/users/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(Map.of("user", UserDto.from(user)));
    }

    @PatchMapping("/users/me")
    public ResponseEntity<Map<String, Object>> updateProfile(@AuthenticationPrincipal User user,
                                                             @Valid @RequestBody UpdateProfileRequest req,
                                                             HttpServletRequest servletRequest) {
        String clientIp = servletRequest.getRemoteAddr();
        UserDto updated = authService.updateProfile(user, req, clientIp);
        return ResponseEntity.ok(Map.of("user", updated));
    }
}
