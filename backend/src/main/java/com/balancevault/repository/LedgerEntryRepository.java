package com.balancevault.repository;

import com.balancevault.entity.EntryType;
import com.balancevault.entity.LedgerEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, String> {

    @Query("SELECT le FROM LedgerEntry le JOIN FETCH le.journalTransaction WHERE le.account.id = :accountId ORDER BY le.createdAt DESC")
    Page<LedgerEntry> findByAccountId(@Param("accountId") String accountId, Pageable pageable);

    @Query("SELECT le FROM LedgerEntry le JOIN FETCH le.journalTransaction WHERE le.account.id = :accountId AND le.createdAt < :cursor ORDER BY le.createdAt DESC")
    List<LedgerEntry> findByAccountIdWithCursor(@Param("accountId") String accountId, @Param("cursor") Instant cursor, Pageable pageable);

    @Query("SELECT COALESCE(SUM(le.amountPaise), 0) FROM LedgerEntry le WHERE le.entryType = :entryType")
    Long sumTotalByType(@Param("entryType") EntryType entryType);
}
