package com.solivio.api.reconditionnement.infrastructure.persistence;

import com.solivio.api.reconditionnement.domain.InscriptionReconditionnement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InscriptionReconditionnementRepository extends JpaRepository<InscriptionReconditionnement, UUID> {

    List<InscriptionReconditionnement> findBySessionId(UUID sessionId);

    Optional<InscriptionReconditionnement> findBySessionIdAndPersonneId(UUID sessionId, UUID personneId);

    long countBySessionIdAndStatut(UUID sessionId, String statut);

    List<InscriptionReconditionnement> findByPersonneId(UUID personneId);
}
