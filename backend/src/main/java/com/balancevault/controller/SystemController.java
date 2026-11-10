package com.balancevault.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class SystemController {

    @GetMapping("/ready")
    public ResponseEntity<Map<String, String>> readinessCheck() {
        return ResponseEntity.ok(Map.of(
                "application", "BalanceVault",
                "status", "ready",
                "engine", "Java Spring Boot & MySQL"
        ));
    }
}
