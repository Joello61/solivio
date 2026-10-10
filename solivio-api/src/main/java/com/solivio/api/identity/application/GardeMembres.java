package com.solivio.api.identity.application;

import com.solivio.api.identity.domain.MembreAssociation;
import com.solivio.api.identity.infrastructure.persistence.MembreAssociationRepository;
import com.solivio.api.shared.exception.ConflictException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Regles qui evitent de laisser l'association sans direction : personne n'agit sur
 * son propre compte depuis la gestion, et il reste toujours un responsable actif.
 */
@Component
public class GardeMembres {

    private final MembreAssociationRepository membreRepository;

    public GardeMembres(MembreAssociationRepository membreRepository) {
        this.membreRepository = membreRepository;
    }

    public void interdireSurSoi(UUID acteurCompteId, UUID cibleCompteId) {
        if (cibleCompteId.equals(acteurCompteId)) {
            throw new ConflictException("Vous ne pouvez pas effectuer cette action sur votre propre compte.");
        }
    }

    /**
     * A appeler avant qu'un membre cesse d'etre responsable actif. Le verrou sur les
     * responsables actifs serialise deux retraits simultanes : le second voit qu'il
     * ne reste qu'un responsable.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void garderUnResponsable(UUID cibleCompteId) {
        List<MembreAssociation> responsables = membreRepository.verrouillerResponsablesActifs();
        boolean cibleEstResponsable = responsables.stream()
            .anyMatch(m -> m.getCompte().getId().equals(cibleCompteId));
        if (cibleEstResponsable && responsables.size() <= 1) {
            throw new ConflictException("L'association doit garder au moins un responsable actif.");
        }
    }
}
