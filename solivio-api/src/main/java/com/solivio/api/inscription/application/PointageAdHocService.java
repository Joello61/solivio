package com.solivio.api.inscription.application;

import com.solivio.api.audit.application.AuditService;
import com.solivio.api.inscription.domain.Inscription;
import com.solivio.api.inscription.domain.PointageAdHoc;
import com.solivio.api.inscription.domain.StatutInscription;
import com.solivio.api.inscription.domain.StatutPresence;
import com.solivio.api.inscription.domain.TypeInscription;
import com.solivio.api.inscription.infrastructure.persistence.InscriptionRepository;
import com.solivio.api.inscription.infrastructure.persistence.PointageAdHocRepository;
import com.solivio.api.inscription.infrastructure.web.dto.PointageAdHocResponse;
import com.solivio.api.inscription.infrastructure.web.dto.PointageInfoResponse;
import com.solivio.api.shared.distribution.DistributionQueryPort;
import com.solivio.api.shared.exception.ConflictException;
import com.solivio.api.shared.exception.NotFoundException;
import com.solivio.api.shared.identity.InvitationPort;
import com.solivio.api.shared.identity.PersonneQueryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class PointageAdHocService {

    private static final List<String> STATUTS_ACTIFS = List.of("PUBLIEE", "EN_COURS", "TERMINEE");

    private final PointageAdHocRepository adHocRepository;
    private final InscriptionRepository inscriptionRepository;
    private final PersonneQueryPort personneQueryPort;
    private final DistributionQueryPort distributionQueryPort;
    private final InvitationPort invitationPort;
    private final AuditService auditService;

    public PointageAdHocService(
        PointageAdHocRepository adHocRepository,
        InscriptionRepository inscriptionRepository,
        PersonneQueryPort personneQueryPort,
        DistributionQueryPort distributionQueryPort,
        InvitationPort invitationPort,
        AuditService auditService
    ) {
        this.adHocRepository = adHocRepository;
        this.inscriptionRepository = inscriptionRepository;
        this.personneQueryPort = personneQueryPort;
        this.distributionQueryPort = distributionQueryPort;
        this.invitationPort = invitationPort;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<PersonneQueryPort.PersonneContactInfo> rechercherMembres(String terme) {
        if (terme == null || terme.isBlank()) {
            return List.of();
        }
        return personneQueryPort.rechercherParNomOuPrenom(terme.trim());
    }

    /**
     * Ajoute un membre existant au pointage avec statut PRESENT.
     * Cree une inscription si elle n'existe pas, reintegre si elle etait annulee.
     * Contourne RG1/RG3 : cette action est exceptionelle et manuelle (coordinateur present).
     */
    public PointageInfoResponse ajouterCompteExistant(
        UUID distributionId,
        UUID personneId,
        String emailPointeur
    ) {
        verifierDistributionActive(distributionId);

        PersonneQueryPort.PersonneContactInfo personne = personneQueryPort.trouverPersonneParId(personneId);
        PersonneQueryPort.PersonneInfo pointeur = personneQueryPort.trouverPersonne(emailPointeur);

        Optional<Inscription> existante = inscriptionRepository
            .findByDistributionIdAndPersonneIdAndType(distributionId, personneId, TypeInscription.BENEVOLE);

        Inscription inscription;
        if (existante.isPresent()) {
            inscription = existante.get();
            if (inscription.getStatut() == StatutInscription.ANNULEE) {
                inscription.reinitialiser(null, personne.nom(), personne.prenom());
            } else if (inscription.getStatut() == StatutInscription.LISTE_ATTENTE) {
                inscription.promouvoir();
            }
        } else {
            inscription = new Inscription(
                distributionId, null, personneId,
                personne.nom(), personne.prenom(),
                TypeInscription.BENEVOLE
            );
        }

        inscription.pointer(StatutPresence.PRESENT, pointeur.id());
        inscriptionRepository.save(inscription);
        auditService.tracer("AJOUT_BENEVOLE_AD_HOC", "distribution", distributionId);

        return new PointageInfoResponse(
            inscription.getId(),
            inscription.getNom(),
            inscription.getPrenom(),
            inscription.getType().name(),
            inscription.getStatut().name(),
            inscription.getPresence().name(),
            null, null
        );
    }

    public PointageAdHocResponse ajouterVisiteur(
        UUID distributionId,
        String nom,
        String prenom,
        String email,
        String role
    ) {
        verifierDistributionActive(distributionId);

        String emailNormalise = (email != null && !email.isBlank()) ? email.trim() : null;
        PointageAdHoc adHoc = new PointageAdHoc(distributionId, nom.trim(), prenom.trim(), emailNormalise, role);
        auditService.tracer("AJOUT_VISITEUR_AD_HOC", "distribution", distributionId);
        return toResponse(adHocRepository.save(adHoc));
    }

    @Transactional(readOnly = true)
    public List<PointageAdHocResponse> lister(UUID distributionId) {
        return adHocRepository.findByDistributionIdOrderByNomAscPrenomAsc(distributionId)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    public void envoyerInvitation(UUID adHocId, UUID compteIdInvitant) {
        PointageAdHoc adHoc = adHocRepository.findById(adHocId)
            .orElseThrow(() -> new NotFoundException("Visiteur introuvable : " + adHocId));

        if (adHoc.getEmail() == null || adHoc.getEmail().isBlank()) {
            throw new IllegalArgumentException("Aucun email renseigné pour ce visiteur.");
        }
        if (adHoc.isInvitationEnvoyee()) {
            throw new ConflictException("Une invitation a déjà été envoyée à ce visiteur.");
        }

        invitationPort.inviterBenevole(adHoc.getEmail(), compteIdInvitant);

        adHoc.setInvitationEnvoyee(true);
        adHocRepository.save(adHoc);
        auditService.tracer(compteIdInvitant, "INVITATION_VISITEUR_AD_HOC", "pointage_ad_hoc", adHocId);
    }

    private void verifierDistributionActive(UUID distributionId) {
        DistributionQueryPort.DistributionInfo distrib =
            distributionQueryPort.trouverDistribution(distributionId);
        if (!STATUTS_ACTIFS.contains(distrib.statut())) {
            throw new ConflictException(
                "Ajout impossible : la distribution n'est pas active (statut : " + distrib.statut() + ")"
            );
        }
    }

    private PointageAdHocResponse toResponse(PointageAdHoc a) {
        return new PointageAdHocResponse(
            a.getId(), a.getNom(), a.getPrenom(), a.getEmail(),
            a.getRole(), a.getPresence(), a.isInvitationEnvoyee(), a.getDatePointage()
        );
    }
}
