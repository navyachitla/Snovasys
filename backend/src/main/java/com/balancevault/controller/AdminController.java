package com.balancevault.controller;

import com.balancevault.dto.AdminDTOs.*;
import com.balancevault.dto.AuthDTOs.UserDto;
import com.balancevault.entity.Role;
import com.balancevault.entity.User;
import com.balancevault.service.AdminService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> listUsers(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "perPage", defaultValue = "50") int perPage,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "role", required = false) Role role,
            @RequestParam(name = "status", required = false) Boolean status) {
        return ResponseEntity.ok(adminService.listUsers(page, perPage, search, role, status));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<Map<String, Object>> updateUserStatus(
            @PathVariable("id") String id,
            @Valid @RequestBody UpdateStatusRequest body,
            @AuthenticationPrincipal User admin,
            HttpServletRequest servletRequest) {
        String clientIp = servletRequest.getRemoteAddr();
        UserDto updated = adminService.updateUserStatus(id, body.isActive(), admin, clientIp);
        return ResponseEntity.ok(Map.of("user", updated));
    }

    @PostMapping("/invitations")
    public ResponseEntity<Map<String, Object>> createInvitation(
            @Valid @RequestBody CreateInvitationRequest req,
            @AuthenticationPrincipal User admin,
            HttpServletRequest servletRequest) {
        String clientIp = servletRequest.getRemoteAddr();
        InvitationDto invitation = adminService.createInvitation(req, admin, clientIp);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("invitation", invitation));
    }

    @GetMapping("/invitations")
    public ResponseEntity<Map<String, Object>> listInvitations() {
        return ResponseEntity.ok(Map.of("invitations", adminService.listInvitations()));
    }

    @PostMapping("/invitations/{id}/revoke")
    public ResponseEntity<Map<String, Object>> revokeInvitation(
            @PathVariable("id") String id,
            @AuthenticationPrincipal User admin,
            HttpServletRequest servletRequest) {
        String clientIp = servletRequest.getRemoteAddr();
        InvitationDto revoked = adminService.revokeInvitation(id, admin, clientIp);
        return ResponseEntity.ok(Map.of("invitation", revoked));
    }
}
