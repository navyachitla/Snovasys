package com.balancevault.controller;

import com.balancevault.dto.TransactionDTOs.*;
import com.balancevault.entity.JournalTransaction;
import com.balancevault.entity.User;
import com.balancevault.exception.CustomExceptions.ResourceNotFoundException;
import com.balancevault.repository.JournalTransactionRepository;
import com.balancevault.service.TransactionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class TransactionController {

    private final TransactionService transactionService;
    private final JournalTransactionRepository transactionRepository;

    public TransactionController(TransactionService transactionService,
                                 JournalTransactionRepository transactionRepository) {
        this.transactionService = transactionService;
        this.transactionRepository = transactionRepository;
    }

    @PostMapping("/transfers")
    public ResponseEntity<TransactionResponse> transfer(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody TransferRequest req,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest) {
        String clientIp = servletRequest.getRemoteAddr();
        TransactionResponse response = transactionService.transfer(req, idempotencyKey, user, clientIp);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/deposits")
    public ResponseEntity<TransactionResponse> deposit(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody DepositRequest req,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest) {
        String clientIp = servletRequest.getRemoteAddr();
        TransactionResponse response = transactionService.deposit(req, idempotencyKey, user, clientIp);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/withdrawals")
    public ResponseEntity<TransactionResponse> withdraw(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody WithdrawalRequest req,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest) {
        String clientIp = servletRequest.getRemoteAddr();
        TransactionResponse response = transactionService.withdraw(req, idempotencyKey, user, clientIp);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/transfers/{id}")
    public ResponseEntity<Map<String, Object>> getTransfer(@PathVariable("id") String id) {
        JournalTransaction tx = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + id));

        return ResponseEntity.ok(Map.of("transfer", Map.of(
                "id", tx.getId(),
                "type", tx.getType(),
                "status", tx.getStatus(),
                "amountPaise", tx.getAmountPaise(),
                "sourceAccountId", tx.getSourceAccount() != null ? tx.getSourceAccount().getId() : null,
                "sourceAccountNumber", tx.getSourceAccount() != null ? tx.getSourceAccount().getAccountNumber() : null,
                "destinationAccountId", tx.getDestinationAccount() != null ? tx.getDestinationAccount().getId() : null,
                "destinationAccountNumber", tx.getDestinationAccount() != null ? tx.getDestinationAccount().getAccountNumber() : null,
                "description", tx.getDescription() != null ? tx.getDescription() : "",
                "createdAt", tx.getCreatedAt()
        )));
    }

    @GetMapping("/ledger/proof")
    public ResponseEntity<Map<String, Object>> getLedgerProof() {
        return ResponseEntity.ok(transactionService.getLedgerProof());
    }
}
