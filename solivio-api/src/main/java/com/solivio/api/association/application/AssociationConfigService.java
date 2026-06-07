package com.solivio.api.association.application;

import com.solivio.api.association.domain.Association;
import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.association.infrastructure.web.dto.AssociationResponse;
import com.solivio.api.association.infrastructure.web.dto.MembreResponse;
import com.solivio.api.association.infrastructure.web.dto.UpdateAssociationRequest;
import com.solivio.api.association.infrastructure.web.dto.UpdateRoleMembreRequest;
import com.solivio.api.identity.domain.MembreAssociation;
import com.solivio.api.identity.infrastructure.persistence.MembreAssociationRepository;
import com.solivio.api.shared.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class AssociationConfigService {

    private final AssociationRepository associationRepository;
    private final MembreAssociationRepository membreRepository;

    public AssociationConfigService(
        AssociationRepository associationRepository,
        MembreAssociationRepository membreRepository
    ) {
        this.associationRepository = associationRepository;
        this.membreRepository = membreRepository;
    }

    @Transactional(readOnly = true)
    public AssociationResponse lire(String tenantSlug) {
        return toResponse(trouverOuEchouer(tenantSlug));
    }

    public AssociationResponse mettreAJour(String tenantSlug, UpdateAssociationRequest request) {
        Association asso = trouverOuEchouer(tenantSlug);
        if (request.nom() != null && !request.nom().isBlank()) {
            asso.setNom(request.nom());
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
        return toResponse(associationRepository.save(asso));
    }

    @Transactional(readOnly = true)
    public List<MembreResponse> listerMembres(String tenantSlug) {
        Association asso = trouverOuEchouer(tenantSlug);
        return membreRepository.findActivesByAssociationId(asso.getId())
            .stream()
            .map(this::toMembreResponse)
            .toList();
    }

    public MembreResponse mettreAJourRole(
        String tenantSlug, UUID compteId, UpdateRoleMembreRequest request
    ) {
        Association asso = trouverOuEchouer(tenantSlug);
        MembreAssociation membre = membreRepository
            .findByCompteIdAndAssociationId(compteId, asso.getId())
            .orElseThrow(() -> new NotFoundException("Membre introuvable : " + compteId));
        membre.setRole(request.role());
        membre.setCoordoType(request.coordoType());
        return toMembreResponse(membreRepository.save(membre));
    }

    public void supprimerMembre(String tenantSlug, UUID compteId) {
        Association asso = trouverOuEchouer(tenantSlug);
        MembreAssociation membre = membreRepository
            .findByCompteIdAndAssociationId(compteId, asso.getId())
            .orElseThrow(() -> new NotFoundException("Membre introuvable : " + compteId));
        // Cloture logique : le membre ne peut plus se connecter a ce tenant.
        membre.setStatut("suspendu");
        membreRepository.save(membre);
    }

    private Association trouverOuEchouer(String tenantSlug) {
        return associationRepository.findBySlug(tenantSlug)
            .orElseThrow(() -> new NotFoundException("Association introuvable : " + tenantSlug));
    }

    private AssociationResponse toResponse(Association a) {
        return new AssociationResponse(
            a.getId(), a.getSlug(), a.getCode(), a.getNom(), a.getStatut(),
            a.getLogoUrl(), a.getCouleurPrimaire(), a.getCouleurSecondaire(),
            a.getFuseauHoraire(), a.getFrequenceMaxParSemaine(),
            a.getContactEmail(), a.getContactTelephone(), a.getDateCreation()
        );
    }

    private MembreResponse toMembreResponse(MembreAssociation m) {
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
