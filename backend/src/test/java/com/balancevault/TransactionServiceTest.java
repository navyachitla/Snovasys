package com.balancevault;

import com.balancevault.dto.TransactionDTOs.DepositRequest;
import com.balancevault.dto.TransactionDTOs.TransactionResponse;
import com.balancevault.dto.TransactionDTOs.TransferRequest;
import com.balancevault.entity.*;
import com.balancevault.exception.CustomExceptions.InsufficientFundsException;
import com.balancevault.repository.AccountRepository;
import com.balancevault.repository.JournalTransactionRepository;
import com.balancevault.repository.UserRepository;
import com.balancevault.service.TransactionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class TransactionServiceTest {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JournalTransactionRepository transactionRepository;

    private User testUser;
    private Account sourceAccount;
    private Account destAccount;

    @BeforeEach
    void setup() {
        testUser = new User("alice@test.com", "hash", "Alice Smith", Role.ACCOUNT_HOLDER);
        testUser = userRepository.save(testUser);

        sourceAccount = new Account("BV-1001", testUser, AccountType.PERSONAL);
        sourceAccount.setBalancePaise(500000L); // ₹5,000.00
        sourceAccount = accountRepository.save(sourceAccount);

        destAccount = new Account("BV-1002", testUser, AccountType.BUSINESS);
        destAccount.setBalancePaise(100000L); // ₹1,000.00
        destAccount = accountRepository.save(destAccount);
    }

    @Test
    @DisplayName("Should successfully transfer funds and maintain double-entry mathematical balance")
    void testSuccessfulTransfer() {
        String idempotencyKey = UUID.randomUUID().toString();
        TransferRequest req = new TransferRequest(sourceAccount.getId(), destAccount.getId(), 200000L, "Rent payment");

        TransactionResponse response = transactionService.transfer(req, idempotencyKey, testUser, "127.0.0.1");

        assertNotNull(response);
        assertEquals(TransactionStatus.POSTED, response.status());
        assertEquals(200000L, response.amountPaise());

        // Verify Account Balances
        Account updatedSource = accountRepository.findById(sourceAccount.getId()).orElseThrow();
        Account updatedDest = accountRepository.findById(destAccount.getId()).orElseThrow();

        assertEquals(300000L, updatedSource.getBalancePaise()); // 500000 - 200000
        assertEquals(300000L, updatedDest.getBalancePaise());   // 100000 + 200000

        // Invariant: Total system balance before transfer == after transfer
        assertEquals(600000L, updatedSource.getBalancePaise() + updatedDest.getBalancePaise());

        // Verify Journal Transaction & Double-Entry Ledger
        JournalTransaction tx = transactionRepository.findById(response.journalTransactionId()).orElseThrow();
        assertEquals(2, tx.getEntries().size());
    }

    @Test
    @DisplayName("Should refuse transfer when source has insufficient funds")
    void testInsufficientFunds() {
        String idempotencyKey = UUID.randomUUID().toString();
        TransferRequest req = new TransferRequest(sourceAccount.getId(), destAccount.getId(), 900000L, "Excessive transfer");

        assertThrows(InsufficientFundsException.class, () ->
                transactionService.transfer(req, idempotencyKey, testUser, "127.0.0.1")
        );

        // Balances remain untouched
        Account updatedSource = accountRepository.findById(sourceAccount.getId()).orElseThrow();
        assertEquals(500000L, updatedSource.getBalancePaise());
    }

    @Test
    @DisplayName("Idempotency key prevents duplicate execution and double-debiting")
    void testIdempotencyProtection() {
        String idempotencyKey = "tx-unique-idempotency-key-12345";
        TransferRequest req = new TransferRequest(sourceAccount.getId(), destAccount.getId(), 100000L, "Idempotent transfer");

        // First execution
        TransactionResponse first = transactionService.transfer(req, idempotencyKey, testUser, "127.0.0.1");
        assertEquals(TransactionStatus.POSTED, first.status());

        // Re-executing with the EXACT SAME idempotency key (simulating network retry)
        TransactionResponse retry = transactionService.transfer(req, idempotencyKey, testUser, "127.0.0.1");
        assertEquals(first.journalTransactionId(), retry.journalTransactionId());

        // Balance should ONLY be debited ONCE (500000 - 100000 = 400000, NOT 300000)
        Account updatedSource = accountRepository.findById(sourceAccount.getId()).orElseThrow();
        assertEquals(400000L, updatedSource.getBalancePaise());
    }

    @Test
    @DisplayName("Deposit increases account balance and creates ledger entry")
    void testDeposit() {
        String idempotencyKey = UUID.randomUUID().toString();
        DepositRequest req = new DepositRequest(sourceAccount.getId(), 50000L, "Cash deposit");

        TransactionResponse response = transactionService.deposit(req, idempotencyKey, testUser, "127.0.0.1");
        assertEquals(TransactionStatus.POSTED, response.status());

        Account updatedSource = accountRepository.findById(sourceAccount.getId()).orElseThrow();
        assertEquals(550000L, updatedSource.getBalancePaise());
    }
}
