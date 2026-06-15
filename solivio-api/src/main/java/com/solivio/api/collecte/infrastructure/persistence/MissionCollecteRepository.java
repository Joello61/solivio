package com.solivio.api.collecte.infrastructure.persistence;

import com.solivio.api.collecte.domain.MissionCollecte;
import com.solivio.api.collecte.domain.StatutMission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MissionCollecteRepository extends JpaRepository<MissionCollecte, UUID> {

    List<MissionCollecte> findAllByOrderByDateHeureAsc();

    List<MissionCollecte> findByStatutOrderByDateHeureAsc(StatutMission statut);

    long countByBenevoleIdAndStatutIn(UUID benevoleId, List<StatutMission> statuts);

    List<MissionCollecte> findByBenevoleIdOrderByDateHeureAsc(UUID benevoleId);
}
