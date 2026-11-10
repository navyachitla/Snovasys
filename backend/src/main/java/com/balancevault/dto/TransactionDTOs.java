package com.balancevault.dto;

import com.balancevault.entity.TransactionStatus;
import com.balancevault.entity.TransactionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.Instant;

public class TransactionDTOs {

    public record TransferRequest(
            @NotBlank(message = "Source account is required")
            String sourceAccountId,

            @NotBlank(message = "Destination account is required")
            String destinationAccountId,

            @NotNull(message = "Amount is required")
            @Positive(message = "Amount must be strictly greater than 0")
            Long amountPaise,

            String description
    ) {}

    public record DepositRequest(
            @NotBlank(message = "Account ID is required")
            String accountId,

            @NotNull(message = "Amount is required")
            @Positive(message = "Amount must be strictly greater than 0")
            Long amountPaise,

            String description
    ) {}

    public record WithdrawalRequest(
            @NotBlank(message = "Account ID is required")
            String accountId,

            @NotNull(message = "Amount is required")
            @Positive(message = "Amount must be strictly greater than 0")
            Long amountPaise,

            String description
    ) {}

    public record TransactionResponse(
            TransactionStatus status,
            String journalTransactionId,
            TransactionType type,
            Long amountPaise,
            Instant createdAt,
            String message
    ) {}

    public record RefusalResponse(
            TransactionStatus status,
            String reason,
            String message
    ) {}
}
