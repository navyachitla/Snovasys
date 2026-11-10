package com.balancevault.controller;

import com.balancevault.dto.AccountDTOs.*;
import com.balancevault.entity.User;
import com.balancevault.service.AccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping
    public ResponseEntity<AccountListResponse> listAccounts(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(accountService.getAccountsForUser(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getAccount(@PathVariable("id") String id,
                                                         @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(Map.of("account", accountService.getAccount(id, user)));
    }

    @GetMapping("/{id}/balance")
    public ResponseEntity<AccountBalanceResponse> getBalance(@PathVariable("id") String id,
                                                             @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(accountService.getAccountBalance(id, user));
    }

    @GetMapping("/{id}/statement")
    public ResponseEntity<StatementResponse> getStatement(
            @PathVariable("id") String id,
            @RequestParam(name = "limit", defaultValue = "25") int limit,
            @RequestParam(name = "cursor", required = false) String cursor,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(accountService.getAccountStatement(id, limit, cursor, user));
    }
}
