# BalanceVault — Money Movement with a Ledger You Can Prove

> **A secure financial account management platform featuring server-enforced role-based access control, onboarding workflows, auditable double-entry ledger operations, and idempotent transaction processing.**

Developed for the **Snovasys Fresher Hiring Challenge 2026**.

---

## 1. System Architecture

BalanceVault decouples front-of-house financial interactions from the back-of-house double-entry accounting ledger.

```mermaid
flowchart TD
    subgraph Client["Frontend (React 18 + Vite)"]
        UI["Modern Responsive UI"]
        AuthCtx["Auth Context & Token Storage"]
        IdemGen["Client UUID Idempotency Generator"]
    end

    subgraph Backend["Backend API (Java 21 Spring Boot 3)"]
        SecFilter["Spring Security JWT Filter"]
        RBAC["Role-Based Access Enforcement"]
        IdemEngine["Idempotency Interceptor & Cache"]
        TxService["Double-Entry Ledger Engine"]
        AuditService["Security & Audit Logger"]
    end

    subgraph DataStore["Data Layer (MySQL 8.0 / In-Memory H2)"]
        UsersTbl[("users & roles")]
        AccountsTbl[("accounts (Optimistic Locked)")]
        JournalTbl[("journal_transactions")]
        LedgerTbl[("ledger_entries")]
        AuditTbl[("audit_logs")]
        IdemTbl[("idempotency_records")]
    end

    Client -->|HTTPS / Bearer JWT| SecFilter
    SecFilter --> RBAC
    RBAC --> IdemEngine
    IdemEngine --> TxService
    TxService --> AccountsTbl
    TxService --> JournalTbl
    TxService --> LedgerTbl
    TxService --> AuditService
    AuditService --> AuditTbl
```

---

## 2. Database Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ ACCOUNTS : owns
    USERS ||--o{ ACCOUNT_REQUESTS : submits
    USERS ||--o{ INVITATIONS : receives
    ACCOUNTS ||--o{ LEDGER_ENTRIES : contains
    JOURNAL_TRANSACTIONS ||--|{ LEDGER_ENTRIES : records
    USERS ||--o{ JOURNAL_TRANSACTIONS : initiates
    USERS ||--o{ AUDIT_LOGS : performs

    USERS {
        string id PK
        string email UK
        string password_hash
        string full_name
        string role "ACCOUNT_HOLDER | ADMIN | AUDITOR"
        boolean is_active
        timestamp created_at
    }

    ACCOUNTS {
        string id PK
        string account_number UK
        string user_id FK
        string type "PERSONAL | BUSINESS"
        string status "ACTIVE | FROZEN | CLOSED"
        bigint balance_paise
        bigint version "Optimistic Lock"
        timestamp created_at
    }

    JOURNAL_TRANSACTIONS {
        string id PK
        string type "TRANSFER | DEPOSIT | WITHDRAWAL"
        string status "POSTED | REFUSED"
        bigint amount_paise
        string source_account_id FK
        string destination_account_id FK
        string idempotency_key UK
        timestamp created_at
    }

    LEDGER_ENTRIES {
        string id PK
        string journal_transaction_id FK
        string account_id FK
        string entry_type "DEBIT | CREDIT"
        bigint amount_paise
        bigint running_balance_paise
        timestamp created_at
    }
```

---

## 3. Core Financial & Security Guarantees

### A. Mathematical Balance Invariant
All balances are handled exclusively as integer **Paise** (`Long`, 1 Rupee = 100 Paise), completely avoiding floating-point precision loss. For every transfer:

$$\Delta \text{Balance}_{\text{Source}} = -\text{amountPaise}$$
$$\Delta \text{Balance}_{\text{Destination}} = +\text{amountPaise}$$
$$\sum \text{Debits} + \sum \text{Credits} = 0$$

### B. Exactly-Once Idempotency Protection
Network retries can lead to double-debiting. Every transfer, deposit, and withdrawal endpoint enforces an `Idempotency-Key` header with client UUID generation. Retrying the same key returns the exact cached receipt without altering balances. Altering the payload with a reused key triggers `HTTP 409 Conflict`.

### C. Optimistic Concurrency Control
Accounts enforce optimistic locking via `@Version Long version`. Simultaneous debit requests across multiple threads are serialized at the database level, preventing race condition overdrafts.

### D. Server-Enforced RBAC
* **`ACCOUNT_HOLDER`**: Submit account opening requests, perform transfers/deposits/withdrawals, review personal statements.
* **`ADMIN`**: Review and approve onboarding queue, assign account numbers, invite admins/auditors, view system-wide audit logs.
* **`AUDITOR`**: Read-only oversight across all accounts, ledger statements, and security logs.

---

## 4. How to Run Locally

### Prerequisites
* Java JDK 21
* Node.js 18+ (for frontend)
* Docker & Docker Compose (optional, for MySQL)

---

### Option A: Complete Stack via Docker Compose (Recommended)

1. Start MySQL 8.0 and the Spring Boot backend:
   ```bash
   docker compose up --build -d
   ```
2. Start the React frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Open your browser at **`http://localhost:5173`**.

---

### Option B: Standalone Spring Boot Backend

The backend includes a zero-setup in-memory H2 profile if you don't have MySQL running locally:

```bash
cd backend
./mvnw clean spring-boot:run -Dspring-boot.run.profiles=dev
```

To run against a local MySQL instance:
```bash
./mvnw clean spring-boot:run -Dspring-boot.run.profiles=mysql
```

---

## 5. Default Administrator Credentials (Bootstrap)

The first administrator is automatically bootstrapped on initial application boot:

| Field | Value |
| :--- | :--- |
| **Email** | `admin@balancevault.com` |
| **Password** | `Admin@Vault2026!` |
| **Role** | `ADMIN` |

---

## 6. Running Automated Tests

Run the full suite of unit and integration tests (verifying double-entry ledger balance, insufficient funds refusal, and idempotency guarantees):

```bash
cd backend
./mvnw test
```

---

## 7. API Reference Summary

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/ready` | Public | System health & engine readiness |
| `POST` | `/api/auth/register` | Public | Register new account holder |
| `POST` | `/api/auth/login` | Public | Authenticate & get JWT |
| `POST` | `/api/auth/accept-invitation` | Public | Complete invited admin/auditor onboarding |
| `GET` | `/api/accounts` | Authenticated | List authorized accounts |
| `GET` | `/api/accounts/{id}/statement` | Authenticated | Fetch cursor-paginated ledger entries |
| `POST` | `/api/transfers` | `ACCOUNT_HOLDER` | Transfer funds (requires `Idempotency-Key`) |
| `POST` | `/api/deposits` | `ACCOUNT_HOLDER` | Deposit funds |
| `POST` | `/api/withdrawals` | `ACCOUNT_HOLDER` | Withdraw funds |
| `GET` | `/api/account-requests/admin/queue` | `ADMIN` | Pending onboarding verification queue |
| `POST` | `/api/account-requests/admin/{id}/approve` | `ADMIN` | Approve request & assign account number |
| `GET` | `/api/audit` | `ADMIN`, `AUDITOR` | Paginated system audit log |

---

## 8. Deployment Guidelines

* **Backend:** Deploy on **Railway** or **Render** using the provided `backend/Dockerfile` and configure MySQL database connection variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).
* **Frontend:** Deploy on **Vercel** or **Netlify** with environment variable `VITE_API_URL=https://<your-backend-domain>`.
