package com.solivio.api.identity.infrastructure.persistence;

import com.solivio.api.identity.domain.MembreAssociation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MembreAssociationRepository extends JpaRepository<MembreAssociation, UUID> {

    Optional<MembreAssociation> findByCompteId(UUID compteId);

    @Query("SELECT m FROM MembreAssociation m WHERE m.compte.id = :compteId AND m.statut = 'actif'")
    Optional<MembreAssociation> findActifByCompteId(UUID compteId);

    @Query("SELECT m FROM MembreAssociation m JOIN FETCH m.compte"
        + " ORDER BY m.statut, m.compte.nom, m.compte.prenom")
    List<MembreAssociation> findAllAvecCompte();

    @Query("SELECT m FROM MembreAssociation m JOIN FETCH m.compte"
        + " WHERE m.role = :role AND m.statut = 'actif'")
    List<MembreAssociation> findActifsByRole(String role);
}
