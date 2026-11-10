package com.balancevault.repository;

import com.balancevault.entity.JournalTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JournalTransactionRepository extends JpaRepository<JournalTransaction, String> {

    Optional<JournalTransaction> findByIdempotencyKey(String idempotencyKey);

    @Query("SELECT j FROM JournalTransaction j WHERE j.sourceAccount.id = :accountId OR j.destinationAccount.id = :accountId ORDER BY j.createdAt DESC")
    Page<JournalTransaction> findByAccountId(@Param("accountId") String accountId, Pageable pageable);
}
