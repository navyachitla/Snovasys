package com.balancevault.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ledger_entries", indexes = {
    @Index(name = "idx_ledger_account", columnList = "account_id"),
    @Index(name = "idx_ledger_created_at", columnList = "created_at")
})
public class LedgerEntry {

    @Id
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "journal_transaction_id", nullable = false)
    private JournalTransaction journalTransaction;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, length = 20)
    private EntryType entryType;

    @Column(name = "amount_paise", nullable = false)
    private Long amountPaise;

    @Column(name = "running_balance_paise", nullable = false)
    private Long runningBalancePaise;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public LedgerEntry() {
    }

    public LedgerEntry(JournalTransaction journalTransaction, Account account,
                       EntryType entryType, Long amountPaise, Long runningBalancePaise) {
        this.id = UUID.randomUUID().toString();
        this.journalTransaction = journalTransaction;
        this.account = account;
        this.entryType = entryType;
        this.amountPaise = amountPaise;
        this.runningBalancePaise = runningBalancePaise;
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        this.createdAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public JournalTransaction getJournalTransaction() {
        return journalTransaction;
    }

    public void setJournalTransaction(JournalTransaction journalTransaction) {
        this.journalTransaction = journalTransaction;
    }

    public Account getAccount() {
        return account;
    }

    public void setAccount(Account account) {
        this.account = account;
    }

    public EntryType getEntryType() {
        return entryType;
    }

    public void setEntryType(EntryType entryType) {
        this.entryType = entryType;
    }

    public Long getAmountPaise() {
        return amountPaise;
    }

    public void setAmountPaise(Long amountPaise) {
        this.amountPaise = amountPaise;
    }

    public Long getRunningBalancePaise() {
        return runningBalancePaise;
    }

    public void setRunningBalancePaise(Long runningBalancePaise) {
        this.runningBalancePaise = runningBalancePaise;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
