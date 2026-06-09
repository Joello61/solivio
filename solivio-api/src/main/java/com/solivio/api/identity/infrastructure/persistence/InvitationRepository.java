package com.solivio.api.identity.infrastructure.persistence;

import com.solivio.api.identity.domain.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface InvitationRepository extends JpaRepository<Invitation, UUID> {

    @Query("SELECT i FROM Invitation i JOIN FETCH i.association JOIN FETCH i.invitePar WHERE i.token = :token")
    Optional<Invitation> findByTokenWithDetails(UUID token);

    boolean existsByEmailAndAssociationIdAndStatut(String email, UUID associationId, String statut);
}
