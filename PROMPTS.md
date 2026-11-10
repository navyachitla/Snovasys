# PROMPTS.md — AI Engineering Log & Decisions

> **Candidate:** Navya Chitla  
> **Challenge:** Snovasys Fresher Hiring Challenge 2026 — BalanceVault  
> **Theme:** Money movement with a ledger you can prove  
> **Technology Stack:** Java Spring Boot, MySQL, React  

---

## 1. Overview & Objective

This document records the prompts used, AI assistant suggestions, where the AI was wrong or made incomplete engineering assumptions, and the exact architectural corrections implemented to make **BalanceVault** secure, auditable, and resilient.

---

## 2. Prompt Log & Engineering Corrections

### Incident 1: Floating-Point Currency Precision Hazards
* **Context:** Initial prompt asking for the database entity design for bank accounts and balances.
* **What the AI Suggested:**
  The AI suggested defining account balances and transaction amounts using `double balance` or standard floating-point numbers in Java and `FLOAT` in the database.
* **Why the AI Was Wrong:**
  IEEE 754 floating-point arithmetic does not represent base-10 decimals exactly (e.g. `0.1 + 0.2 = 0.30000000000000004`). In a financial ledger, rounding artifacts cause money leakage and prevent the fundamental accounting invariant $\sum \text{Debits} = \sum \text{Credits}$ from balancing to zero.
* **What I Fixed:**
  1. Converted all financial amounts in Java entities (`Account`, `JournalTransaction`, `LedgerEntry`) to `Long` representing **Paise** (1 Rupee = 100 Paise).
  2. Mapped to `BIGINT` in MySQL.
  3. Formatted currency on the frontend exclusively with `Intl.NumberFormat('en-IN')` with integer quotient and remainder calculations (`BigInt(paise) / 100n`).

---

### Incident 2: The Double-Spending Network Retry Bug (Missing Idempotency)
* **Context:** Prompting for REST API endpoints to transfer money (`POST /api/transfers`).
* **What the AI Suggested:**
  A straightforward endpoint that executes the transfer every time a POST request arrives.
* **Why the AI Was Wrong:**
  In real-world networks, mobile apps and browsers often experience transient connection drops or timeouts. If the client retries an unacknowledged HTTP request, the backend executes the transfer a second time, resulting in **double debits** for the sender.
* **What I Fixed:**
  1. Enforced a client-generated UUID header `Idempotency-Key` on all money movement endpoints (`/api/transfers`, `/api/deposits`, `/api/withdrawals`).
  2. Built an `IdempotencyRecord` entity in MySQL that stores `(idempotencyKey, userId, payloadHash, responseBody, httpStatus)`.
  3. If a retry arrives with the exact same payload hash, the server returns the cached response without deducting money again.
  4. If a request arrives with the same key but altered payload, the server rejects it with `HTTP 409 Conflict (idempotency_key_conflict)`.

---

### Incident 3: Cloud Database Privilege Failure & The First Administrator Bootstrap
* **Context:** Creating the initial administrator account on database setup.
* **What the AI Suggested:**
  The AI suggested executing PostgreSQL DDL scripts altering roles (`ALTER ROLE ... WITH PASSWORD`) or directly managing database-level operator roles.
* **Why the AI Was Wrong:**
  As demonstrated in the demo project report, cloud-managed serverless databases (like Neon or AWS RDS) reject role alteration commands with `SQLSTATE 42501 (insufficient_privilege)` because the connection user is not a database superuser.
* **What I Fixed:**
  1. Shifted administrator bootstrapping out of fragile database DDL into a Spring Boot `CommandLineRunner` (`DataInitializer`).
  2. On application startup, it safely verifies `userRepository.countByRole(Role.ADMIN)`.
  3. If count is 0, it creates the initial `admin@balancevault.com` using Spring Security's `BCryptPasswordEncoder` with credentials supplied via environment variables (`ADMIN_BOOTSTRAP_PASSWORD`).
  4. Subsequent administrators or auditors are onboarded cleanly via the administrative invitation token workflow (`/api/admin/invitations`).

---

### Incident 4: Concurrency Race Conditions on Account Balances (Lost Updates)
* **Context:** Simultaneous transfers initiated from the same account.
* **What the AI Suggested:**
  Fetching an account, subtracting the amount, and saving:
  ```java
  account.setBalance(account.getBalance() - amount);
  accountRepository.save(account);
  ```
* **Why the AI Was Wrong:**
  If two requests hit the server concurrently (Thread A and Thread B), both read the initial balance of ₹5,000 simultaneously. Thread A deducts ₹2,000 and writes ₹3,000. Thread B deducts ₹2,000 and overwrites with ₹3,000. The user spent ₹4,000, but their balance only decreased by ₹2,000 (a classic **lost update** race condition).
* **What I Fixed:**
  1. Added JPA optimistic concurrency control on `Account`:
     ```java
     @Version
     @Column(name = "version")
     private Long version;
     ```
  2. Added `@Transactional(isolation = Isolation.READ_COMMITTED)` across financial services.
  3. Added verified unit tests simulating concurrent transfers to ensure double-spending is physically rejected.

---

### Incident 5: Provable Double-Entry Bookkeeping vs Simple Transaction History
* **Context:** Architecture for transaction logging.
* **What the AI Suggested:**
  A single `transactions` table with columns `(id, from_user, to_user, amount, date)`.
* **Why the AI Was Wrong:**
  A single transaction log is not provable. It doesn't track account-level running balances, cannot be reconciled with an accounting trial balance, and cannot represent external deposits or cash withdrawals without creating dummy accounts.
* **What I Fixed:**
  1. Built a true double-entry bookkeeping engine:
     * `JournalTransaction`: Represents the atomic business transaction (`TRANSFER`, `DEPOSIT`, `WITHDRAWAL`).
     * `LedgerEntry`: Represents the two balanced line items (`DEBIT` source, `CREDIT` destination) with an immutable snapshot of `runningBalancePaise`.
  2. Account statement queries read directly from `LedgerEntry`, guaranteeing that historical running balance entries can be audited and proved.

---

## 3. Honest Statement of What is Finished vs Unfinished

### What is Finished & Fully Verified:
- [x] Java Spring Boot 3.3 REST API with Java 21.
- [x] MySQL database schema with JPA/Hibernate entities and relationships.
- [x] Spring Security with stateless HMAC-SHA256 JWT tokens.
- [x] Server-enforced Role-Based Access Control (`ACCOUNT_HOLDER`, `ADMIN`, `AUDITOR`).
- [x] Automatic, deterministic First Administrator Bootstrap on application startup.
- [x] Account Holder registration and onboarding workflow (`PERSONAL` & `BUSINESS` requests).
- [x] Administrator Onboarding Review Queue (compliance review, account number assignment).
- [x] Double-entry money movement (Transfers, Deposits, Withdrawals) in integer Paise.
- [x] Idempotency Key validation protecting against network retries and duplicate debits.
- [x] Account Statements with cursor pagination and historical running balances.
- [x] Complete Audit Trail recording all security and financial events.
- [x] React frontend with dashboard, transaction review screen, and administrative consoles.
- [x] Docker Compose configuration for multi-container spin-up (MySQL 8.0 + Spring Boot).
- [x] Automated JUnit 5 integration tests verifying ledger math and idempotency.

### What is Unfinished / Future Improvements:
- [ ] Multi-currency exchange rate conversions (currently standardizes on INR).
- [ ] Push notifications / WebSockets for live statement updates across active sessions.
- [ ] Scheduled monthly PDF statement generation export.
