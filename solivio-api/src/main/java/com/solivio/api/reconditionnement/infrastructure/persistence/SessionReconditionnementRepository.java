package com.solivio.api.reconditionnement.infrastructure.persistence;

import com.solivio.api.reconditionnement.domain.SessionReconditionnement;
import com.solivio.api.reconditionnement.domain.StatutSessionReconditionnement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SessionReconditionnementRepository extends JpaRepository<SessionReconditionnement, UUID> {

    List<SessionReconditionnement> findAllByOrderByDateHeureDebutDesc();

    List<SessionReconditionnement> findByStatutOrderByDateHeureDebutDesc(StatutSessionReconditionnement statut);
}
