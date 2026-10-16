package com.solivio.api.reconditionnement.infrastructure.persistence;

import com.solivio.api.reconditionnement.domain.InscriptionReconditionnement;
import com.solivio.api.reconditionnement.domain.StatutSessionReconditionnement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InscriptionReconditionnementRepository extends JpaRepository<InscriptionReconditionnement, UUID> {

    List<InscriptionReconditionnement> findBySessionId(UUID sessionId);

    Optional<InscriptionReconditionnement> findBySessionIdAndPersonneId(UUID sessionId, UUID personneId);

    long countBySessionIdAndStatut(UUID sessionId, String statut);

    List<InscriptionReconditionnement> findByPersonneId(UUID personneId);

    @Query("SELECT COUNT(i) > 0 FROM InscriptionReconditionnement i, SessionReconditionnement s"
        + " WHERE s.id = i.sessionId AND i.personneId = :personneId AND i.statut = 'CONFIRMEE'"
        + " AND s.statut IN :statuts")
    boolean existeInscriptionConfirmee(UUID personneId, Collection<StatutSessionReconditionnement> statuts);
}
