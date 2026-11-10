package com.balancevault.service;

import com.balancevault.dto.AccountDTOs.*;
import com.balancevault.entity.*;
import com.balancevault.exception.CustomExceptions.*;
import com.balancevault.repository.AccountRepository;
import com.balancevault.repository.AccountRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class AccountRequestService {

    private final AccountRequestRepository accountRequestRepository;
    private final AccountRepository accountRepository;
    private final AuditService auditService;

    public AccountRequestService(AccountRequestRepository accountRequestRepository,
                                 AccountRepository accountRepository,
                                 AuditService auditService) {
        this.accountRequestRepository = accountRequestRepository;
        this.accountRepository = accountRepository;
        this.auditService = auditService;
    }

    @Transactional
    public AccountRequestDto submitRequest(CreateAccountRequestDto req, User user, String clientIp) {
        if (accountRequestRepository.existsByUserIdAndStatus(user.getId(), RequestStatus.PENDING)) {
            throw new BadRequestException("You already have an account opening request pending review.");
        }

        AccountRequest accountRequest = new AccountRequest(user, req.requestedType());
        accountRequest = accountRequestRepository.save(accountRequest);

        auditService.record(user.getId(), user.getRole().name(), "ACCOUNT_REQUEST_SUBMITTED",
                "ACCOUNT_REQUEST", accountRequest.getId(),
                "Requested " + req.requestedType() + " account", clientIp);

        return AccountRequestDto.from(accountRequest);
    }

    @Transactional(readOnly = true)
    public List<AccountRequestDto> getUserRequests(User user) {
        return accountRequestRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(AccountRequestDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AccountRequestDto> getAdminQueue() {
        return accountRequestRepository.findByStatusOrderByCreatedAtAsc(RequestStatus.PENDING)
                .stream()
                .map(AccountRequestDto::from)
                .toList();
    }

    @Transactional
    public AccountDto approveRequest(String requestId, String accountNumber, User admin, String clientIp) {
        AccountRequest request = accountRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Account request not found: " + requestId));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Request is already " + request.getStatus());
        }

        String cleanedAccountNumber = accountNumber.trim().toUpperCase();
        if (accountRepository.existsByAccountNumber(cleanedAccountNumber)) {
            throw new BadRequestException("Account number " + cleanedAccountNumber + " is already assigned.");
        }

        // Create the official Account
        Account account = new Account(cleanedAccountNumber, request.getUser(), request.getRequestedType());
        account = accountRepository.save(account);

        // Update Request Status
        request.setStatus(RequestStatus.APPROVED);
        request.setReviewedBy(admin.getId());
        request.setReviewedAt(Instant.now());
        request.setAdminNote("Approved by admin " + admin.getFullName() + ". Assigned: " + cleanedAccountNumber);
        accountRequestRepository.save(request);

        auditService.record(admin.getId(), admin.getRole().name(), "ACCOUNT_REQUEST_APPROVED",
                "ACCOUNT", account.getId(),
                "Assigned account number " + cleanedAccountNumber + " to user " + request.getUser().getEmail(),
                clientIp);

        return AccountDto.from(account);
    }

    @Transactional
    public AccountRequestDto rejectRequest(String requestId, String note, User admin, String clientIp) {
        AccountRequest request = accountRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Account request not found: " + requestId));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Request is already " + request.getStatus());
        }

        request.setStatus(RequestStatus.REJECTED);
        request.setReviewedBy(admin.getId());
        request.setReviewedAt(Instant.now());
        request.setAdminNote(note != null && !note.isBlank() ? note : "Reviewed and declined by administrator.");
        accountRequestRepository.save(request);

        auditService.record(admin.getId(), admin.getRole().name(), "ACCOUNT_REQUEST_REJECTED",
                "ACCOUNT_REQUEST", request.getId(),
                "Declined request. Note: " + request.getAdminNote(),
                clientIp);

        return AccountRequestDto.from(request);
    }
}
