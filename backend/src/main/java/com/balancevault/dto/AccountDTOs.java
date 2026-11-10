package com.balancevault.dto;

import com.balancevault.entity.*;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;

public class AccountDTOs {

    public record AccountDto(
            String id,
            String accountNumber,
            AccountType type,
            AccountStatus status,
            String currency,
            Long balancePaise,
            Instant createdAt
    ) {
        public static AccountDto from(Account account) {
            return new AccountDto(
                    account.getId(),
                    account.getAccountNumber(),
                    account.getType(),
                    account.getStatus(),
                    account.getCurrency(),
                    account.getBalancePaise(),
                    account.getCreatedAt()
            );
        }
    }

    public record AccountListResponse(
            List<AccountDto> accounts
    ) {}

    public record AccountDetailResponse(
            AccountDto account
    ) {}

    public record AccountBalanceResponse(
            String accountId,
            String accountNumber,
            Long balancePaise,
            String currency
    ) {}

    public record CreateAccountRequestDto(
            @NotNull(message = "Requested type is required")
            AccountType requestedType
    ) {}

    public record AccountRequestDto(
            String id,
            String userId,
            String userFullName,
            String userEmail,
            AccountType requestedType,
            RequestStatus status,
            String adminNote,
            Instant createdAt
    ) {
        public static AccountRequestDto from(AccountRequest req) {
            return new AccountRequestDto(
                    req.getId(),
                    req.getUser().getId(),
                    req.getUser().getFullName(),
                    req.getUser().getEmail(),
                    req.getRequestedType(),
                    req.getStatus(),
                    req.getAdminNote(),
                    req.getCreatedAt()
            );
        }
    }

    public record AccountRequestListResponse(
            List<AccountRequestDto> requests
    ) {}

    public record StatementEntryDto(
            String id,
            String journalTransactionId,
            EntryType entryType,
            Long amountPaise,
            Long runningBalancePaise,
            TransactionStatus status,
            String description,
            TransactionType transactionType,
            Instant createdAt
    ) {
        public static StatementEntryDto from(LedgerEntry entry) {
            JournalTransaction tx = entry.getJournalTransaction();
            return new StatementEntryDto(
                    entry.getId(),
                    tx != null ? tx.getId() : null,
                    entry.getEntryType(),
                    // positive if credit, negative if debit for UI convenience
                    entry.getEntryType() == EntryType.DEBIT ? -entry.getAmountPaise() : entry.getAmountPaise(),
                    entry.getRunningBalancePaise(),
                    tx != null ? tx.getStatus() : TransactionStatus.POSTED,
                    tx != null ? tx.getDescription() : "",
                    tx != null ? tx.getType() : TransactionType.TRANSFER,
                    entry.getCreatedAt()
            );
        }
    }

    public record StatementResponse(
            String accountId,
            String accountNumber,
            Long currentBalancePaise,
            List<StatementEntryDto> entries,
            String nextCursor,
            boolean hasMore
    ) {}
}
