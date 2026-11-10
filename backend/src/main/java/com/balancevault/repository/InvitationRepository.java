package com.balancevault.repository;

import com.balancevault.entity.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, String> {

    Optional<Invitation> findByToken(String token);

    List<Invitation> findAllByOrderByCreatedAtDesc();

    Optional<Invitation> findByEmailAndIsUsedFalseAndIsRevokedFalse(String email);
}
