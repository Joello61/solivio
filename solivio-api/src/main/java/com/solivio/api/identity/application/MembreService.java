package com.solivio.api.identity.application;

import com.solivio.api.audit.application.AuditService;
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

    private static final String RESPONSABLE = "responsable";
    private static final String SUSPENDU = "suspendu";

    private final MembreAssociationRepository membreRepository;
    private final GardeMembres garde;
    private final AuditService auditService;

    public MembreService(MembreAssociationRepository membreRepository, GardeMembres garde, AuditService auditService) {
        this.membreRepository = membreRepository;
        this.garde = garde;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<MembreResponse> lister() {
        return membreRepository.findAllAvecCompte().stream()
            .map(this::toResponse)
            .toList();
    }

    public MembreResponse changerStatut(UUID compteId, String statut, UUID acteurCompteId) {
        garde.interdireSurSoi(acteurCompteId, compteId);
        MembreAssociation membre = trouverOuEchouer(compteId);
        if (SUSPENDU.equals(statut)) {
            garde.garderUnResponsable(compteId);
        }
        membre.setStatut(statut);
        String action = SUSPENDU.equals(statut) ? "MEMBRE_SUSPENDU" : "MEMBRE_REACTIVE";
        auditService.tracer(acteurCompteId, action, "compte", compteId);
        return toResponse(membreRepository.save(membre));
    }

    public MembreResponse mettreAJourRole(UUID compteId, UpdateRoleMembreRequest request, UUID acteurCompteId) {
        garde.interdireSurSoi(acteurCompteId, compteId);
        MembreAssociation membre = trouverOuEchouer(compteId);
        if (!RESPONSABLE.equals(request.role())) {
            garde.garderUnResponsable(compteId);
        }
        membre.setRole(request.role());
        membre.setCoordoType(request.coordoType());
        auditService.tracer(acteurCompteId, "ROLE_MEMBRE_MODIFIE", "compte", compteId);
        return toResponse(membreRepository.save(membre));
    }

    // Cloture logique : le membre perd son role mais garde son historique.
    public void suspendre(UUID compteId, UUID acteurCompteId) {
        changerStatut(compteId, SUSPENDU, acteurCompteId);
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
