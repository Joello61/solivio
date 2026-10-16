package com.solivio.api.evenement.infrastructure.persistence;

import com.solivio.api.evenement.domain.ParticipationEvenement;
import com.solivio.api.evenement.domain.RoleParticipation;
import com.solivio.api.evenement.domain.StatutEvenement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ParticipationEvenementRepository extends JpaRepository<ParticipationEvenement, UUID> {

    List<ParticipationEvenement> findByEvenementIdOrderByDateInscriptionAsc(UUID evenementId);

    List<ParticipationEvenement> findByEvenementIdAndRoleOrderByDateInscriptionAsc(
        UUID evenementId, RoleParticipation role);

    List<ParticipationEvenement> findByPersonneIdOrderByDateInscriptionDesc(UUID personneId);

    Optional<ParticipationEvenement> findByEvenementIdAndPersonneIdAndRole(
        UUID evenementId, UUID personneId, RoleParticipation role);

    long countByEvenementIdAndRole(UUID evenementId, RoleParticipation role);

    boolean existsByEvenementIdAndPersonneIdAndRole(
        UUID evenementId, UUID personneId, RoleParticipation role);

    @Query("SELECT COUNT(p) > 0 FROM ParticipationEvenement p, Evenement e"
        + " WHERE e.id = p.evenementId AND p.personneId = :personneId AND e.statut IN :statuts")
    boolean existeParticipation(UUID personneId, Collection<StatutEvenement> statuts);
}
