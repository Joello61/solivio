package com.solivio.api.association.application;

import com.solivio.api.association.domain.Association;
import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.association.infrastructure.web.dto.AssociationResponse;
import com.solivio.api.association.infrastructure.web.dto.UpdateAssociationRequest;
import com.solivio.api.audit.application.AuditService;
import com.solivio.api.shared.web.Assainissement;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneId;


@Service
@Transactional
public class AssociationConfigService {

    private final AssociationRepository associationRepository;
    private final AuditService auditService;

    public AssociationConfigService(AssociationRepository associationRepository, AuditService auditService) {
        this.associationRepository = associationRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public AssociationResponse lire() {
        return toResponse(charger());
    }

    public AssociationResponse mettreAJour(UpdateAssociationRequest request) {
        Association asso = charger();
        if (request.nom() != null && !request.nom().isBlank()) {
            asso.setNom(Assainissement.nettoyer(request.nom()));
        }
        if (request.logoUrl() != null) {
            asso.setLogoUrl(request.logoUrl());
        }
        if (request.couleurPrimaire() != null) {
            asso.setCouleurPrimaire(request.couleurPrimaire());
        }
        if (request.couleurSecondaire() != null) {
            asso.setCouleurSecondaire(request.couleurSecondaire());
        }
        if (request.fuseauHoraire() != null && !request.fuseauHoraire().isBlank()) {
            if (!ZoneId.getAvailableZoneIds().contains(request.fuseauHoraire())) {
                throw new IllegalArgumentException("Fuseau horaire inconnu : " + request.fuseauHoraire());
            }
            asso.setFuseauHoraire(request.fuseauHoraire());
        }
        if (request.frequenceMaxParSemaine() != null) {
            asso.setFrequenceMaxParSemaine(
                request.frequenceMaxParSemaine() <= 0 ? null : request.frequenceMaxParSemaine()
            );
        }
        if (request.contactEmail() != null) {
            asso.setContactEmail(request.contactEmail());
        }
        if (request.contactTelephone() != null) {
            asso.setContactTelephone(request.contactTelephone());
        }
        auditService.tracer("ASSOCIATION_MODIFIEE", "association", asso.getId());
        return toResponse(associationRepository.save(asso));
    }

    // La ligne est creee par la migration V2 : son absence est une erreur d'installation.
    Association charger() {
        return associationRepository.findUnique()
            .orElseThrow(() -> new IllegalStateException("Configuration de l'association absente"));
    }

    private AssociationResponse toResponse(Association a) {
        return new AssociationResponse(
            a.getId(), a.getNom(),
            a.getLogoUrl(), a.getCouleurPrimaire(), a.getCouleurSecondaire(),
            a.getFuseauHoraire(), a.getFrequenceMaxParSemaine(),
            a.getContactEmail(), a.getContactTelephone(), a.getDateCreation()
        );
    }
}
