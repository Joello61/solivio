package com.solivio.api.identity.infrastructure.persistence;

import com.solivio.api.identity.domain.MembreAssociation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MembreAssociationRepository extends JpaRepository<MembreAssociation, UUID> {

    List<MembreAssociation> findByCompteIdAndStatut(UUID compteId, String statut);

    @Query("SELECT m FROM MembreAssociation m JOIN FETCH m.compte"
        + " WHERE m.association.id = :associationId AND m.statut = 'actif'")
    List<MembreAssociation> findActivesByAssociationId(UUID associationId);

    @Query("SELECT m FROM MembreAssociation m JOIN FETCH m.compte"
        + " WHERE m.association.id = :associationId"
        + " ORDER BY m.statut, m.compte.nom, m.compte.prenom")
    List<MembreAssociation> findAllByAssociationId(UUID associationId);

    Optional<MembreAssociation> findByCompteIdAndAssociationId(UUID compteId, UUID associationId);

    boolean existsByCompteIdAndAssociationId(UUID compteId, UUID associationId);

    @Query("SELECT m FROM MembreAssociation m JOIN FETCH m.association"
        + " WHERE m.compte.id = :compteId AND m.statut = 'actif'")
    List<MembreAssociation> findActivesByCompteId(UUID compteId);
}
