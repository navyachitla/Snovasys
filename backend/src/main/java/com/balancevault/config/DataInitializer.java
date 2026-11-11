package com.balancevault.config;

import com.balancevault.entity.*;
import com.balancevault.repository.AccountRepository;
import com.balancevault.repository.JournalTransactionRepository;
import com.balancevault.repository.LedgerEntryRepository;
import com.balancevault.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final JournalTransactionRepository transactionRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${balancevault.bootstrap.admin.enabled:true}")
    private boolean bootstrapEnabled;

    @Value("${balancevault.bootstrap.admin.email:admin@balancevault.com}")
    private String adminEmail;

    @Value("${balancevault.bootstrap.admin.name:System Administrator}")
    private String adminName;

    @Value("${balancevault.bootstrap.admin.password:Admin@Vault2026!}")
    private String adminPassword;

    public DataInitializer(UserRepository userRepository,
                           AccountRepository accountRepository,
                           JournalTransactionRepository transactionRepository,
                           LedgerEntryRepository ledgerEntryRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!bootstrapEnabled) {
            return;
        }

        User admin = userRepository.findByEmail(adminEmail).orElse(null);
        if (admin == null) {
            log.info("===============================================================");
            log.info("BALANCEVAULT: Bootstrapping initial Administrator account...");
            admin = new User(
                    adminEmail,
                    passwordEncoder.encode(adminPassword),
                    adminName,
                    Role.ADMIN
            );
            admin = userRepository.save(admin);
            log.info("BALANCEVAULT: Admin successfully created: {}", adminEmail);
            log.info("===============================================================");
        }

        // Seed system reserve vault account for double-entry balancing
        if (!accountRepository.existsByAccountNumber("ACT-SYSTEM-VAULT")) {
            Account vault = new Account("ACT-SYSTEM-VAULT", admin, AccountType.VAULT);
            vault.setBalancePaise(1000000000L); // ₹10,000,000 Reserve
            accountRepository.save(vault);
            log.info("BALANCEVAULT: System Reserve Vault initialized (ACT-SYSTEM-VAULT)");
        }

        // Seed Auditor user
        if (!userRepository.existsByEmail("auditor@balancevault.com")) {
            User auditor = new User(
                    "auditor@balancevault.com",
                    passwordEncoder.encode("Auditor@Vault2026!"),
                    "Lead Compliance Auditor",
                    Role.AUDITOR
            );
            userRepository.save(auditor);
            log.info("BALANCEVAULT: Auditor user created: auditor@balancevault.com");
        }

        // Seed demo account holder and initial accounts
        if (!userRepository.existsByEmail("demo@balancevault.com")) {
            log.info("BALANCEVAULT: Creating demo Account Holder (demo@balancevault.com)...");
            User demo = new User(
                    "demo@balancevault.com",
                    passwordEncoder.encode("Demo@Vault2026!"),
                    "Demo Account Holder",
                    Role.ACCOUNT_HOLDER
            );
            demo = userRepository.save(demo);

            Account personal = new Account("ACT-DEMO-001", demo, AccountType.PERSONAL);
            personal.setBalancePaise(5000000L); // ₹50,000.00
            personal = accountRepository.save(personal);

            Account business = new Account("ACT-DEMO-002", demo, AccountType.BUSINESS);
            business.setBalancePaise(1000000L); // ₹10,000.00
            business = accountRepository.save(business);

            Account vault = accountRepository.findByAccountNumber("ACT-SYSTEM-VAULT").orElse(null);

            // Record initial seeded deposit in ledger (Debit Vault, Credit Personal)
            JournalTransaction initTx = new JournalTransaction(
                    TransactionType.DEPOSIT,
                    5000000L,
                    vault,
                    personal,
                    "Opening balance settlement deposit",
                    "INIT-DEPOSIT-DEMO-001",
                    demo
            );
            initTx = transactionRepository.save(initTx);

            LedgerEntry creditEntry = new LedgerEntry(initTx, personal, EntryType.CREDIT, 5000000L, personal.getBalancePaise());
            initTx.addEntry(creditEntry);
            ledgerEntryRepository.save(creditEntry);

            if (vault != null) {
                LedgerEntry debitEntry = new LedgerEntry(initTx, vault, EntryType.DEBIT, 5000000L, vault.getBalancePaise());
                initTx.addEntry(debitEntry);
                ledgerEntryRepository.save(debitEntry);
            }

            log.info("BALANCEVAULT: Demo account holder ready with ACT-DEMO-001 (₹50,000) and balanced ledger entry.");
        }
    }
}
