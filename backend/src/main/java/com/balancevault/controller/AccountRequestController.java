package com.balancevault.controller;

import com.balancevault.dto.AccountDTOs.*;
import com.balancevault.dto.AdminDTOs.ApproveRequestDto;
import com.balancevault.dto.AdminDTOs.RejectRequestDto;
import com.balancevault.entity.User;
import com.balancevault.service.AccountRequestService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/account-requests")
public class AccountRequestController {

    private final AccountRequestService requestService;

    public AccountRequestController(AccountRequestService requestService) {
        this.requestService = requestService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> submitRequest(
            @Valid @RequestBody CreateAccountRequestDto req,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest) {
        String clientIp = servletRequest.getRemoteAddr();
        AccountRequestDto dto = requestService.submitRequest(req, user, clientIp);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("request", dto));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getUserRequests(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(Map.of("requests", requestService.getUserRequests(user)));
    }

    @GetMapping("/admin/queue")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAdminQueue() {
        return ResponseEntity.ok(Map.of("requests", requestService.getAdminQueue()));
    }

    @PostMapping("/admin/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> approveRequest(
            @PathVariable("id") String id,
            @Valid @RequestBody ApproveRequestDto body,
            @AuthenticationPrincipal User admin,
            HttpServletRequest servletRequest) {
        String clientIp = servletRequest.getRemoteAddr();
        AccountDto account = requestService.approveRequest(id, body.accountNumber(), admin, clientIp);
        return ResponseEntity.ok(Map.of("account", account));
    }

    @PostMapping("/admin/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> rejectRequest(
            @PathVariable("id") String id,
            @RequestBody(required = false) RejectRequestDto body,
            @AuthenticationPrincipal User admin,
            HttpServletRequest servletRequest) {
        String clientIp = servletRequest.getRemoteAddr();
        String note = body != null ? body.note() : null;
        AccountRequestDto request = requestService.rejectRequest(id, note, admin, clientIp);
        return ResponseEntity.ok(Map.of("request", request));
    }
}
