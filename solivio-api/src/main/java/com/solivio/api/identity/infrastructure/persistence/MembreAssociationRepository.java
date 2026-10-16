package com.solivio.api.identity.infrastructure.persistence;

import com.solivio.api.identity.domain.MembreAssociation;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
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

    /** Membres actifs ayant au moins un des roles, chacun une seule fois. */
    @Query("SELECT DISTINCT m FROM MembreAssociation m JOIN FETCH m.compte JOIN m.roles r"
        + " WHERE r IN :roles AND m.statut = 'actif'")
    List<MembreAssociation> findActifsByRoles(Collection<String> roles);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM MembreAssociation m WHERE 'responsable' MEMBER OF m.roles AND m.statut = 'actif'")
    List<MembreAssociation> verrouillerResponsablesActifs();

    @Query("SELECT m.compte.id FROM MembreAssociation m"
        + " WHERE 'responsable' MEMBER OF m.roles AND m.statut = 'actif'")
    List<UUID> trouverComptesResponsablesActifs();
}
