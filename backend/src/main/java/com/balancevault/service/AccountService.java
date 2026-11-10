package com.balancevault.service;

import com.balancevault.dto.AccountDTOs.*;
import com.balancevault.entity.Account;
import com.balancevault.entity.LedgerEntry;
import com.balancevault.entity.Role;
import com.balancevault.entity.User;
import com.balancevault.exception.CustomExceptions.*;
import com.balancevault.repository.AccountRepository;
import com.balancevault.repository.LedgerEntryRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final LedgerEntryRepository ledgerEntryRepository;

    public AccountService(AccountRepository accountRepository,
                          LedgerEntryRepository ledgerEntryRepository) {
        this.accountRepository = accountRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
    }

    @Transactional(readOnly = true)
    public AccountListResponse getAccountsForUser(User user) {
        List<Account> accounts;
        if (user.getRole() == Role.ADMIN || user.getRole() == Role.AUDITOR) {
            accounts = accountRepository.findAll();
        } else {
            accounts = accountRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        }
        return new AccountListResponse(accounts.stream().map(AccountDto::from).toList());
    }

    @Transactional(readOnly = true)
    public AccountDto getAccount(String accountId, User user) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + accountId));

        validateAccountAccess(account, user);
        return AccountDto.from(account);
    }

    @Transactional(readOnly = true)
    public AccountBalanceResponse getAccountBalance(String accountId, User user) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + accountId));

        validateAccountAccess(account, user);
        return new AccountBalanceResponse(account.getId(), account.getAccountNumber(),
                account.getBalancePaise(), account.getCurrency());
    }

    @Transactional(readOnly = true)
    public StatementResponse getAccountStatement(String accountId, int limit, String cursor, User user) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + accountId));

        validateAccountAccess(account, user);

        int fetchLimit = Math.min(Math.max(1, limit), 100);
        PageRequest pageRequest = PageRequest.of(0, fetchLimit + 1);

        List<LedgerEntry> entries;
        if (cursor != null && !cursor.isBlank()) {
            Instant cursorTime = Instant.parse(cursor);
            entries = ledgerEntryRepository.findByAccountIdWithCursor(accountId, cursorTime, pageRequest);
        } else {
            entries = ledgerEntryRepository.findByAccountId(accountId, pageRequest).getContent();
        }

        boolean hasMore = entries.size() > fetchLimit;
        List<LedgerEntry> pagedEntries = hasMore ? entries.subList(0, fetchLimit) : entries;

        String nextCursor = null;
        if (hasMore && !pagedEntries.isEmpty()) {
            nextCursor = pagedEntries.get(pagedEntries.size() - 1).getCreatedAt().toString();
        }

        List<StatementEntryDto> dtos = pagedEntries.stream().map(StatementEntryDto::from).toList();

        return new StatementResponse(
                account.getId(),
                account.getAccountNumber(),
                account.getBalancePaise(),
                dtos,
                nextCursor,
                hasMore
        );
    }

    private void validateAccountAccess(Account account, User user) {
        if (user.getRole() == Role.ADMIN || user.getRole() == Role.AUDITOR) {
            return;
        }
        if (!account.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("You do not have permission to access this account.");
        }
    }
}
