package com.solivio.api.identity.application;

import com.solivio.api.audit.application.AuditService;
import com.solivio.api.identity.domain.MembreAssociation;
import com.solivio.api.identity.domain.RolesMembre;
import com.solivio.api.identity.infrastructure.persistence.MembreAssociationRepository;
import com.solivio.api.identity.infrastructure.persistence.PersonneRepository;
import com.solivio.api.identity.infrastructure.web.dto.MembreResponse;
import com.solivio.api.identity.infrastructure.web.dto.UpdateRolesMembreRequest;
import com.solivio.api.shared.engagement.EngagementsAVenirPort;
import com.solivio.api.shared.exception.ConflictException;
import com.solivio.api.shared.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Gestion des membres de l'association (roles, statut). Les membres sont des
 * comptes du module identity : cette gestion y vit, et non dans association.
 */
@Service
@Transactional
public class MembreService {

    private static final String SUSPENDU = "suspendu";

    private final MembreAssociationRepository membreRepository;
    private final PersonneRepository personneRepository;
    private final List<EngagementsAVenirPort> engagements;
    private final GardeMembres garde;
    private final AuditService auditService;

    public MembreService(MembreAssociationRepository membreRepository, PersonneRepository personneRepository,
                         List<EngagementsAVenirPort> engagements, GardeMembres garde, AuditService auditService) {
        this.membreRepository = membreRepository;
        this.personneRepository = personneRepository;
        this.engagements = engagements;
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

    /**
     * Roles fixes par un responsable. Nommer quelqu'un responsable lui retire ses autres
     * roles : c'est refuse tant qu'il a des engagements a venir, qu'il ne pourrait plus tenir.
     */
    public MembreResponse mettreAJourRoles(UUID compteId, UpdateRolesMembreRequest request, UUID acteurCompteId) {
        garde.interdireSurSoi(acteurCompteId, compteId);
        MembreAssociation membre = trouverOuEchouer(compteId);
        Set<String> roles = Set.copyOf(request.roles());
        boolean devientResponsable = roles.contains(RolesMembre.RESPONSABLE) && !membre.estResponsable();
        if (devientResponsable && aDesEngagementsAVenir(membre)) {
            throw new ConflictException("Cette personne a des inscriptions à venir : elle pourra être nommée "
                + "responsable une fois qu'elles seront passées ou annulées.");
        }
        if (membre.estResponsable() && !roles.contains(RolesMembre.RESPONSABLE)) {
            garde.garderUnResponsable(compteId);
        }
        membre.remplacerRoles(roles);
        membre.setCoordoType(roles.contains(RolesMembre.COORDINATEUR) ? request.coordoType() : null);
        auditService.tracer(acteurCompteId, "ROLE_MEMBRE_MODIFIE", "compte", compteId);
        return toResponse(membreRepository.save(membre));
    }

    /** Un membre devient aussi benevole ou beneficiaire, sans validation (ADR-012). */
    public MembreResponse ajouterMonRole(UUID compteId, String role, boolean attestationEtudiant) {
        RolesMembre.choisisSeul(Set.of(role), attestationEtudiant);
        MembreAssociation membre = membreRepository.findActifByCompteId(compteId)
            .orElseThrow(() -> new NotFoundException("Membre introuvable : " + compteId));
        membre.ajouterRole(role);
        auditService.tracer(compteId, "ROLE_AJOUTE_PAR_MEMBRE", "compte", compteId);
        return toResponse(membreRepository.save(membre));
    }

    // Cloture logique : le membre perd ses droits mais garde son historique.
    public void suspendre(UUID compteId, UUID acteurCompteId) {
        changerStatut(compteId, SUSPENDU, acteurCompteId);
    }

    private boolean aDesEngagementsAVenir(MembreAssociation membre) {
        return personneRepository.findByCompteEmail(membre.getCompte().getEmail())
            .map(p -> engagements.stream().anyMatch(port -> port.aDesEngagementsAVenir(p.getId())))
            .orElse(false);
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
            m.rolesTries(),
            m.getCoordoType(),
            m.getStatut(),
            m.getDateDebut()
        );
    }
}
