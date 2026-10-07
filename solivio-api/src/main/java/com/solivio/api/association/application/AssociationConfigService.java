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
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
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
    public AssociationResponse lire() {
        return toResponse(charger());
    }

    public AssociationResponse mettreAJour(UpdateAssociationRequest request) {
        Association asso = charger();
        if (request.nom() != null && !request.nom().isBlank()) {
            asso.setNom(Jsoup.clean(request.nom(), Safelist.none()));
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
    public List<MembreResponse> listerMembres() {
        return membreRepository.findAllAvecCompte()
            .stream()
            .map(this::toMembreResponse)
            .toList();
    }

    public MembreResponse changerStatutMembre(UUID compteId, String statut) {
        MembreAssociation membre = membreRepository
            .findByCompteId(compteId)
            .orElseThrow(() -> new NotFoundException("Membre introuvable : " + compteId));
        membre.setStatut(statut);
        return toMembreResponse(membreRepository.save(membre));
    }

    public MembreResponse mettreAJourRole(UUID compteId, UpdateRoleMembreRequest request) {
        MembreAssociation membre = membreRepository
            .findByCompteId(compteId)
            .orElseThrow(() -> new NotFoundException("Membre introuvable : " + compteId));
        membre.setRole(request.role());
        membre.setCoordoType(request.coordoType());
        return toMembreResponse(membreRepository.save(membre));
    }

    public void supprimerMembre(UUID compteId) {
        MembreAssociation membre = membreRepository
            .findByCompteId(compteId)
            .orElseThrow(() -> new NotFoundException("Membre introuvable : " + compteId));
        // Cloture logique : le membre perd son role mais garde son historique.
        membre.setStatut("suspendu");
        membreRepository.save(membre);
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
