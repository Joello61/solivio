package com.solivio.api.identity.application;

import com.solivio.api.identity.domain.MembreAssociation;
import com.solivio.api.identity.infrastructure.persistence.MembreAssociationRepository;
import com.solivio.api.identity.infrastructure.web.dto.MembreResponse;
import com.solivio.api.identity.infrastructure.web.dto.UpdateRoleMembreRequest;
import com.solivio.api.shared.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Gestion des membres de l'association (role, statut). Les membres sont des
 * comptes du module identity : cette gestion y vit, et non dans association.
 */
@Service
@Transactional
public class MembreService {

    private final MembreAssociationRepository membreRepository;

    public MembreService(MembreAssociationRepository membreRepository) {
        this.membreRepository = membreRepository;
    }

    @Transactional(readOnly = true)
    public List<MembreResponse> lister() {
        return membreRepository.findAllAvecCompte().stream()
            .map(this::toResponse)
            .toList();
    }

    public MembreResponse changerStatut(UUID compteId, String statut) {
        MembreAssociation membre = trouverOuEchouer(compteId);
        membre.setStatut(statut);
        return toResponse(membreRepository.save(membre));
    }

    public MembreResponse mettreAJourRole(UUID compteId, UpdateRoleMembreRequest request) {
        MembreAssociation membre = trouverOuEchouer(compteId);
        membre.setRole(request.role());
        membre.setCoordoType(request.coordoType());
        return toResponse(membreRepository.save(membre));
    }

    // Cloture logique : le membre perd son role mais garde son historique.
    public void suspendre(UUID compteId) {
        changerStatut(compteId, "suspendu");
    }

    private MembreAssociation trouverOuEchouer(UUID compteId) {
        return membreRepository.findByCompteId(compteId)
            .orElseThrow(() -> new NotFoundException("Membre introuvable : " + compteId));
    }

    private MembreResponse toResponse(MembreAssociation m) {
        return new MembreResponse(
            m.getCompte().getId(),
            m.getCompte().getNom(),
            m.getCompte().getPrenom(),
            m.getCompte().getEmail(),
            m.getRole(),
            m.getCoordoType(),
            m.getStatut(),
            m.getDateDebut()
        );
    }
}
