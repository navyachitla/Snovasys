package com.balancevault.service;

import com.balancevault.dto.TransactionDTOs.*;
import com.balancevault.entity.*;
import com.balancevault.exception.CustomExceptions.*;
import com.balancevault.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;

@Service
public class TransactionService {

    private final AccountRepository accountRepository;
    private final JournalTransactionRepository transactionRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final IdempotencyRepository idempotencyRepository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    public TransactionService(AccountRepository accountRepository,
                              JournalTransactionRepository transactionRepository,
                              LedgerEntryRepository ledgerEntryRepository,
                              IdempotencyRepository idempotencyRepository,
                              AuditService auditService,
                              ObjectMapper objectMapper) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
        this.idempotencyRepository = idempotencyRepository;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TransactionResponse transfer(TransferRequest req, String idempotencyKey, User user, String clientIp) {
        String payloadHash = hashPayload("TRANSFER", req.sourceAccountId(), req.destinationAccountId(), req.amountPaise());
        Optional<TransactionResponse> cached = checkIdempotency(idempotencyKey, user.getId(), "/api/transfers", payloadHash);
        if (cached.isPresent()) {
            return cached.get();
        }

        if (req.sourceAccountId().equals(req.destinationAccountId())) {
            throw new BadRequestException("Source and destination accounts cannot be the same.");
        }

        Account source = accountRepository.findById(req.sourceAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Source account not found"));
        Account dest = accountRepository.findById(req.destinationAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Destination account not found"));

        validateAccountOwnership(source, user);

        if (source.getStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("Source account is " + source.getStatus());
        }
        if (dest.getStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("Destination account is " + dest.getStatus());
        }

        if (source.getBalancePaise() < req.amountPaise()) {
            auditService.record(user.getId(), user.getRole().name(), "TRANSFER_REFUSED_INSUFFICIENT_FUNDS",
                    "ACCOUNT", source.getId(),
                    "Attempted transfer of " + req.amountPaise() + " paise, available: " + source.getBalancePaise(),
                    clientIp);
            throw new InsufficientFundsException("The account does not have enough available funds for this transfer.");
        }

        // Apply Double-Entry Movement
        source.setBalancePaise(source.getBalancePaise() - req.amountPaise());
        dest.setBalancePaise(dest.getBalancePaise() + req.amountPaise());

        accountRepository.save(source);
        accountRepository.save(dest);

        JournalTransaction tx = new JournalTransaction(
                TransactionType.TRANSFER,
                req.amountPaise(),
                source,
                dest,
                req.description() != null ? req.description() : "Account to account transfer",
                idempotencyKey,
                user
        );
        tx = transactionRepository.save(tx);

        // Debit Entry for Source
        LedgerEntry debitEntry = new LedgerEntry(tx, source, EntryType.DEBIT, req.amountPaise(), source.getBalancePaise());
        tx.addEntry(debitEntry);
        ledgerEntryRepository.save(debitEntry);

        // Credit Entry for Destination
        LedgerEntry creditEntry = new LedgerEntry(tx, dest, EntryType.CREDIT, req.amountPaise(), dest.getBalancePaise());
        tx.addEntry(creditEntry);
        ledgerEntryRepository.save(creditEntry);

        auditService.record(user.getId(), user.getRole().name(), "TRANSFER_POSTED",
                "JOURNAL_TRANSACTION", tx.getId(),
                "Transferred " + req.amountPaise() + " paise from " + source.getAccountNumber() + " to " + dest.getAccountNumber(),
                clientIp);

        TransactionResponse response = new TransactionResponse(
                TransactionStatus.POSTED,
                tx.getId(),
                tx.getType(),
                tx.getAmountPaise(),
                tx.getCreatedAt(),
                "Transfer posted successfully."
        );

        saveIdempotency(idempotencyKey, user.getId(), "/api/transfers", payloadHash, response);
        return response;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TransactionResponse deposit(DepositRequest req, String idempotencyKey, User user, String clientIp) {
        String payloadHash = hashPayload("DEPOSIT", req.accountId(), req.amountPaise());
        Optional<TransactionResponse> cached = checkIdempotency(idempotencyKey, user.getId(), "/api/deposits", payloadHash);
        if (cached.isPresent()) {
            return cached.get();
        }

        Account account = accountRepository.findById(req.accountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        validateAccountOwnership(account, user);

        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("Account is " + account.getStatus());
        }

        // Apply Credit Movement
        account.setBalancePaise(account.getBalancePaise() + req.amountPaise());
        accountRepository.save(account);

        JournalTransaction tx = new JournalTransaction(
                TransactionType.DEPOSIT,
                req.amountPaise(),
                null,
                account,
                req.description() != null ? req.description() : "Funds deposit",
                idempotencyKey,
                user
        );
        tx = transactionRepository.save(tx);

        LedgerEntry creditEntry = new LedgerEntry(tx, account, EntryType.CREDIT, req.amountPaise(), account.getBalancePaise());
        tx.addEntry(creditEntry);
        ledgerEntryRepository.save(creditEntry);

        auditService.record(user.getId(), user.getRole().name(), "DEPOSIT_POSTED",
                "JOURNAL_TRANSACTION", tx.getId(),
                "Deposited " + req.amountPaise() + " paise to account " + account.getAccountNumber(),
                clientIp);

        TransactionResponse response = new TransactionResponse(
                TransactionStatus.POSTED,
                tx.getId(),
                tx.getType(),
                tx.getAmountPaise(),
                tx.getCreatedAt(),
                "Deposit posted successfully."
        );

        saveIdempotency(idempotencyKey, user.getId(), "/api/deposits", payloadHash, response);
        return response;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TransactionResponse withdraw(WithdrawalRequest req, String idempotencyKey, User user, String clientIp) {
        String payloadHash = hashPayload("WITHDRAWAL", req.accountId(), req.amountPaise());
        Optional<TransactionResponse> cached = checkIdempotency(idempotencyKey, user.getId(), "/api/withdrawals", payloadHash);
        if (cached.isPresent()) {
            return cached.get();
        }

        Account account = accountRepository.findById(req.accountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        validateAccountOwnership(account, user);

        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("Account is " + account.getStatus());
        }

        if (account.getBalancePaise() < req.amountPaise()) {
            auditService.record(user.getId(), user.getRole().name(), "WITHDRAWAL_REFUSED_INSUFFICIENT_FUNDS",
                    "ACCOUNT", account.getId(),
                    "Attempted withdrawal of " + req.amountPaise() + " paise, available: " + account.getBalancePaise(),
                    clientIp);
            throw new InsufficientFundsException("The account does not have enough available funds for this withdrawal.");
        }

        // Apply Debit Movement
        account.setBalancePaise(account.getBalancePaise() - req.amountPaise());
        accountRepository.save(account);

        JournalTransaction tx = new JournalTransaction(
                TransactionType.WITHDRAWAL,
                req.amountPaise(),
                account,
                null,
                req.description() != null ? req.description() : "Funds withdrawal",
                idempotencyKey,
                user
        );
        tx = transactionRepository.save(tx);

        LedgerEntry debitEntry = new LedgerEntry(tx, account, EntryType.DEBIT, req.amountPaise(), account.getBalancePaise());
        tx.addEntry(debitEntry);
        ledgerEntryRepository.save(debitEntry);

        auditService.record(user.getId(), user.getRole().name(), "WITHDRAWAL_POSTED",
                "JOURNAL_TRANSACTION", tx.getId(),
                "Withdrew " + req.amountPaise() + " paise from account " + account.getAccountNumber(),
                clientIp);

        TransactionResponse response = new TransactionResponse(
                TransactionStatus.POSTED,
                tx.getId(),
                tx.getType(),
                tx.getAmountPaise(),
                tx.getCreatedAt(),
                "Withdrawal posted successfully."
        );

        saveIdempotency(idempotencyKey, user.getId(), "/api/withdrawals", payloadHash, response);
        return response;
    }

    private void validateAccountOwnership(Account account, User user) {
        if (user.getRole() == Role.ADMIN) {
            return;
        }
        if (!account.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("You do not own this account.");
        }
    }

    private Optional<TransactionResponse> checkIdempotency(String idempotencyKey, String userId, String path, String payloadHash) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return Optional.empty();
        }

        return idempotencyRepository.findByIdempotencyKeyAndUserId(idempotencyKey, userId)
                .map(record -> {
                    if (!record.getPayloadHash().equals(payloadHash)) {
                        throw new IdempotencyConflictException("This idempotency key belongs to a different transaction request.");
                    }
                    try {
                        return objectMapper.readValue(record.getResponseBody(), TransactionResponse.class);
                    } catch (Exception e) {
                        throw new RuntimeException("Failed to deserialize idempotency response", e);
                    }
                });
    }

    private void saveIdempotency(String idempotencyKey, String userId, String path, String payloadHash, TransactionResponse response) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return;
        }
        try {
            String json = objectMapper.writeValueAsString(response);
            IdempotencyRecord record = new IdempotencyRecord(idempotencyKey, userId, path, payloadHash, json, 200);
            idempotencyRepository.save(record);
        } catch (Exception ignored) {
        }
    }

    private String hashPayload(Object... parts) {
        try {
            StringBuilder sb = new StringBuilder();
            for (Object p : parts) {
                sb.append(p).append("::");
            }
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(sb.toString().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }
}
