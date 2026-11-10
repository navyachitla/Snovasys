package com.balancevault.repository;

import com.balancevault.entity.AccountRequest;
import com.balancevault.entity.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccountRequestRepository extends JpaRepository<AccountRequest, String> {

    List<AccountRequest> findByUserIdOrderByCreatedAtDesc(String userId);

    List<AccountRequest> findByStatusOrderByCreatedAtAsc(RequestStatus status);

    boolean existsByUserIdAndStatus(String userId, RequestStatus status);
}
