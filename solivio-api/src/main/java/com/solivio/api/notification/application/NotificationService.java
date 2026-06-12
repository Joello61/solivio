package com.solivio.api.notification.application;

import com.solivio.api.notification.application.NotificationEmailService.ContexteCollecteEmail;
import com.solivio.api.notification.application.NotificationEmailService.ContexteEmail;
import com.solivio.api.notification.application.NotificationEmailService.ContexteEvenementEmail;
import com.solivio.api.notification.application.NotificationEmailService.ContexteReconditionnementEmail;
import com.solivio.api.notification.domain.Notification;
import com.solivio.api.notification.domain.TypeEvenementNotification;
import com.solivio.api.notification.infrastructure.email.NotificationEmailException;
import com.solivio.api.notification.infrastructure.persistence.NotificationRepository;
import com.solivio.api.shared.association.AssociationQueryPort;
import com.solivio.api.shared.collecte.MissionCollecteQueryPort;
import com.solivio.api.shared.collecte.MissionCollecteQueryPort.MissionInfo;
import com.solivio.api.shared.distribution.DistributionQueryPort;
import com.solivio.api.shared.distribution.DistributionQueryPort.DistributionDetailInfo;
import com.solivio.api.shared.evenement.EvenementQueryPort;
import com.solivio.api.shared.evenement.EvenementQueryPort.EvenementInfo;
import com.solivio.api.shared.identity.PersonneQueryPort;
import com.solivio.api.shared.identity.PersonneQueryPort.PersonneContactInfo;
import com.solivio.api.shared.inscription.InscriptionQueryPort;
import com.solivio.api.shared.inscription.InscriptionQueryPort.DestinataireMail;
import com.solivio.api.shared.reconditionnement.SessionReconditionnementQueryPort;
import com.solivio.api.shared.reconditionnement.SessionReconditionnementQueryPort.SessionInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationEmailService emailService;
    private final NotificationRepository notificationRepository;
    private final PersonneQueryPort personneQueryPort;
    private final DistributionQueryPort distributionQueryPort;
    private final InscriptionQueryPort inscriptionQueryPort;
    private final SessionReconditionnementQueryPort sessionReconditionnementQueryPort;
    private final MissionCollecteQueryPort missionCollecteQueryPort;
    private final EvenementQueryPort evenementQueryPort;
    private final AssociationQueryPort associationQueryPort;

    public NotificationService(
        NotificationEmailService emailService,
        NotificationRepository notificationRepository,
        PersonneQueryPort personneQueryPort,
        DistributionQueryPort distributionQueryPort,
        InscriptionQueryPort inscriptionQueryPort,
        SessionReconditionnementQueryPort sessionReconditionnementQueryPort,
        MissionCollecteQueryPort missionCollecteQueryPort,
        EvenementQueryPort evenementQueryPort,
        AssociationQueryPort associationQueryPort
    ) {
        this.emailService = emailService;
        this.notificationRepository = notificationRepository;
        this.personneQueryPort = personneQueryPort;
        this.distributionQueryPort = distributionQueryPort;
        this.inscriptionQueryPort = inscriptionQueryPort;
        this.sessionReconditionnementQueryPort = sessionReconditionnementQueryPort;
        this.missionCollecteQueryPort = missionCollecteQueryPort;
        this.evenementQueryPort = evenementQueryPort;
        this.associationQueryPort = associationQueryPort;
    }

    @Transactional
    public void notifierConfirmationInscription(
        UUID personneId, UUID distributionId, String typeInscription, UUID creneauId
    ) {
        PersonneContactInfo personne = personneQueryPort.trouverPersonneParId(personneId);
        DistributionDetailInfo distribution = distributionQueryPort.trouverDistributionDetails(distributionId);
        ContexteEmail contexte = construireContexte(
            personne.prenom(), typeInscription, creneauId, distributionId, distribution);
        String sujet = "Votre inscription est confirmee - " + distribution.titre();
        envoyerEtTracer(personne.id(), distributionId,
            TypeEvenementNotification.CONFIRMATION_INSCRIPTION, sujet,
            () -> emailService.envoyerConfirmationInscription(personne.email(), contexte));
    }

    @Transactional
    public void notifierPromotionListeAttente(
        UUID personneId, UUID distributionId, String typeInscription, UUID creneauId
    ) {
        PersonneContactInfo personne = personneQueryPort.trouverPersonneParId(personneId);
        DistributionDetailInfo distribution = distributionQueryPort.trouverDistributionDetails(distributionId);
        ContexteEmail contexte = construireContexte(
            personne.prenom(), typeInscription, creneauId, distributionId, distribution);
        String sujet = "Une place est disponible - " + distribution.titre();
        envoyerEtTracer(personne.id(), distributionId,
            TypeEvenementNotification.PROMOTION_LISTE_ATTENTE, sujet,
            () -> emailService.envoyerPromotionListeAttente(personne.email(), contexte));
    }

    @Transactional
    public void notifierAnnulationDistribution(UUID distributionId) {
        DistributionDetailInfo distribution = distributionQueryPort.trouverDistributionDetails(distributionId);
        String sujet = "Distribution annulee - " + distribution.titre();
        List<DestinataireMail> destinataires = inscriptionQueryPort.trouverInscritsConfirmes(distributionId);
        for (DestinataireMail dest : destinataires) {
            ContexteEmail contexte = construireContexte(
                dest.prenom(), dest.typeInscription(), dest.creneauId(), distributionId, distribution);
            envoyerEtTracer(dest.personneId(), distributionId,
                TypeEvenementNotification.ANNULATION_DISTRIBUTION, sujet,
                () -> emailService.envoyerAnnulationDistribution(dest.email(), contexte));
        }
    }

    @Transactional
    public void notifierDesistementTardifBenevole(UUID personneBenevoleId, UUID distributionId) {
        PersonneContactInfo benevole = personneQueryPort.trouverPersonneParId(personneBenevoleId);
        DistributionDetailInfo distribution = distributionQueryPort.trouverDistributionDetails(distributionId);
        String sujet = "Desistement tardif benevole - " + distribution.titre();
        List<PersonneContactInfo> coordinateurs = personneQueryPort.trouverContactsParRole("coordinateur");
        for (PersonneContactInfo coord : coordinateurs) {
            envoyerEtTracer(coord.id(), distributionId,
                TypeEvenementNotification.DESISTEMENT_TARDIF_BENEVOLE, sujet,
                () -> emailService.envoyerDesistementTardifBenevole(
                    coord.email(), coord.prenom(),
                    benevole.prenom(), benevole.nom(),
                    distribution));
        }
    }

    @Transactional
    public void notifierRappelVeille(UUID distributionId) {
        DistributionDetailInfo distribution = distributionQueryPort.trouverDistributionDetails(distributionId);
        String sujet = "Rappel : distribution demain - " + distribution.titre();
        List<DestinataireMail> destinataires = inscriptionQueryPort.trouverInscritsConfirmes(distributionId);
        for (DestinataireMail dest : destinataires) {
            ContexteEmail contexte = construireContexte(
                dest.prenom(), dest.typeInscription(), dest.creneauId(), distributionId, distribution);
            envoyerEtTracer(dest.personneId(), distributionId,
                TypeEvenementNotification.RAPPEL_VEILLE, sujet,
                () -> emailService.envoyerRappelVeille(dest.email(), contexte));
        }
    }

    private ContexteEmail construireContexte(
        String prenom,
        String typeInscription,
        UUID creneauId,
        UUID distributionId,
        DistributionDetailInfo distribution
    ) {
        if (creneauId != null) {
            DistributionQueryPort.CreneauInfo creneau =
                distributionQueryPort.trouverCreneau(creneauId, distributionId);
            return ContexteEmail.of(prenom, typeInscription,
                creneau.heureDebut(), creneau.heureFin(), distribution);
        }
        return ContexteEmail.of(prenom, typeInscription, null, null, distribution);
    }

    @Transactional
    public void notifierConfirmationInscriptionReconditionnement(UUID personneId, UUID sessionId) {
        PersonneContactInfo personne = personneQueryPort.trouverPersonneParId(personneId);
        SessionInfo session = sessionReconditionnementQueryPort.trouverSessionDetails(sessionId);
        ContexteReconditionnementEmail contexte = new ContexteReconditionnementEmail(
            personne.prenom(), session.titre(), session.dateHeureDebut(),
            session.dateHeureFin(), session.lieu(), null);
        String sujet = "Inscription confirmee - " + session.titre();
        envoyerEtTracerReco(personne.id(), sessionId,
            TypeEvenementNotification.CONFIRMATION_INSCRIPTION_RECONDITIONNEMENT, sujet,
            () -> emailService.envoyerConfirmationInscriptionReconditionnement(personne.email(), contexte));
    }

    @Transactional
    public void notifierAnnulationSessionReconditionnement(UUID sessionId) {
        SessionInfo session = sessionReconditionnementQueryPort.trouverSessionDetails(sessionId);
        String sujet = "Session annulee - " + session.titre();
        List<UUID> personneIds = sessionReconditionnementQueryPort
            .trouverPersonnesInscritesConfirmees(sessionId);
        for (UUID personneId : personneIds) {
            PersonneContactInfo personne = personneQueryPort.trouverPersonneParId(personneId);
            ContexteReconditionnementEmail contexte = new ContexteReconditionnementEmail(
                personne.prenom(), session.titre(), session.dateHeureDebut(),
                session.dateHeureFin(), session.lieu(), null);
            envoyerEtTracerReco(personne.id(), sessionId,
                TypeEvenementNotification.ANNULATION_SESSION_RECONDITIONNEMENT, sujet,
                () -> emailService.envoyerAnnulationSessionReconditionnement(personne.email(), contexte));
        }
    }

    @Transactional
    public void notifierCreationMissionCollecte(UUID missionId) {
        MissionInfo mission = missionCollecteQueryPort.trouverMissionDetails(missionId);
        String sujet = "Nouvelle mission de collecte - " + mission.titre();
        List<PersonneContactInfo> benevoles = personneQueryPort.trouverContactsParRole("benevole");
        for (PersonneContactInfo benevole : benevoles) {
            ContexteCollecteEmail contexte = new ContexteCollecteEmail(
                benevole.prenom(), mission.titre(), mission.dateHeure(),
                mission.lieuCollecteAdresse(), mission.lieuDepotAdresse(), null);
            envoyerEtTracerReco(benevole.id(), missionId,
                TypeEvenementNotification.CREATION_MISSION_COLLECTE, sujet,
                () -> emailService.envoyerCreationMissionCollecte(benevole.email(), contexte));
        }
    }

    @Transactional
    public void notifierAnnulationMissionCollecte(UUID missionId, UUID benevoleAssigneId) {
        if (benevoleAssigneId == null) {
            return;
        }
        MissionInfo mission = missionCollecteQueryPort.trouverMissionDetails(missionId);
        PersonneContactInfo benevole = personneQueryPort.trouverPersonneParId(benevoleAssigneId);
        String sujet = "Mission annulee - " + mission.titre();
        ContexteCollecteEmail contexte = new ContexteCollecteEmail(
            benevole.prenom(), mission.titre(), mission.dateHeure(),
            mission.lieuCollecteAdresse(), mission.lieuDepotAdresse(), null);
        envoyerEtTracerReco(benevole.id(), missionId,
            TypeEvenementNotification.ANNULATION_MISSION_COLLECTE, sujet,
            () -> emailService.envoyerAnnulationMissionCollecte(benevole.email(), contexte));
    }

    @Transactional
    public void notifierPublicationEvenement(UUID evenementId) {
        EvenementInfo evenement = evenementQueryPort.trouverEvenementDetails(evenementId);
        String sujet = "Nouvel evenement - " + evenement.titre();
        Set<UUID> notifies = new HashSet<>();

        if (evenement.aBesoiNStaff()) {
            for (PersonneContactInfo b : personneQueryPort.trouverContactsParRole("benevole")) {
                if (notifies.add(b.id())) {
                    ContexteEvenementEmail ctx = new ContexteEvenementEmail(
                        b.prenom(), evenement.titre(), evenement.dateHeureDebut(),
                        evenement.lieuAdresseFormatee(), null);
                    envoyerEtTracerReco(b.id(), evenementId,
                        TypeEvenementNotification.PUBLICATION_EVENEMENT, sujet,
                        () -> emailService.envoyerPublicationEvenement(b.email(), ctx));
                }
            }
        }

        if (evenement.ouvertParticipants() && evenement.publicParticipants() != null) {
            switch (evenement.publicParticipants()) {
                case "BENEVOLES" -> {
                    for (PersonneContactInfo b : personneQueryPort.trouverContactsParRole("benevole")) {
                        if (notifies.add(b.id())) {
                            ContexteEvenementEmail ctx = new ContexteEvenementEmail(
                                b.prenom(), evenement.titre(), evenement.dateHeureDebut(),
                                evenement.lieuAdresseFormatee(), null);
                            envoyerEtTracerReco(b.id(), evenementId,
                                TypeEvenementNotification.PUBLICATION_EVENEMENT, sujet,
                                () -> emailService.envoyerPublicationEvenement(b.email(), ctx));
                        }
                    }
                }
                case "BENEFICIAIRES" -> {
                    for (PersonneContactInfo p : personneQueryPort.trouverContactsParRole("beneficiaire")) {
                        if (notifies.add(p.id())) {
                            ContexteEvenementEmail ctx = new ContexteEvenementEmail(
                                p.prenom(), evenement.titre(), evenement.dateHeureDebut(),
                                evenement.lieuAdresseFormatee(), null);
                            envoyerEtTracerReco(p.id(), evenementId,
                                TypeEvenementNotification.PUBLICATION_EVENEMENT, sujet,
                                () -> emailService.envoyerPublicationEvenement(p.email(), ctx));
                        }
                    }
                }
                case "TOUS" -> {
                    for (PersonneContactInfo b : personneQueryPort.trouverContactsParRole("benevole")) {
                        if (notifies.add(b.id())) {
                            ContexteEvenementEmail ctx = new ContexteEvenementEmail(
                                b.prenom(), evenement.titre(), evenement.dateHeureDebut(),
                                evenement.lieuAdresseFormatee(), null);
                            envoyerEtTracerReco(b.id(), evenementId,
                                TypeEvenementNotification.PUBLICATION_EVENEMENT, sujet,
                                () -> emailService.envoyerPublicationEvenement(b.email(), ctx));
                        }
                    }
                    for (PersonneContactInfo p : personneQueryPort.trouverContactsParRole("beneficiaire")) {
                        if (notifies.add(p.id())) {
                            ContexteEvenementEmail ctx = new ContexteEvenementEmail(
                                p.prenom(), evenement.titre(), evenement.dateHeureDebut(),
                                evenement.lieuAdresseFormatee(), null);
                            envoyerEtTracerReco(p.id(), evenementId,
                                TypeEvenementNotification.PUBLICATION_EVENEMENT, sujet,
                                () -> emailService.envoyerPublicationEvenement(p.email(), ctx));
                        }
                    }
                }
                default -> log.warn("publicParticipants inconnu : {}", evenement.publicParticipants());
            }
        }
    }

    @Transactional
    public void notifierAnnulationEvenement(UUID evenementId, String tenantSlug) {
        EvenementInfo evenement = evenementQueryPort.trouverEvenementDetails(evenementId);
        String sujet = "Evenement annule - " + evenement.titre();
        String raison = evenement.raisonAnnulation();

        switch (evenement.modeInscription()) {
            case "OBLIGATOIRE", "LIBRE" -> {
                List<UUID> inscrits = evenementQueryPort.trouverInscrits(evenementId);
                for (UUID personneId : inscrits) {
                    PersonneContactInfo p = personneQueryPort.trouverPersonneParId(personneId);
                    ContexteEvenementEmail ctx = new ContexteEvenementEmail(
                        p.prenom(), evenement.titre(), evenement.dateHeureDebut(),
                        evenement.lieuAdresseFormatee(), raison);
                    envoyerEtTracerReco(p.id(), evenementId,
                        TypeEvenementNotification.ANNULATION_EVENEMENT, sujet,
                        () -> emailService.envoyerAnnulationEvenement(p.email(), ctx));
                }
                if ("LIBRE".equals(evenement.modeInscription())) {
                    associationQueryPort.trouverContactEmail(tenantSlug).ifPresent(contactEmail -> {
                        ContexteEvenementEmail ctx = new ContexteEvenementEmail(
                            null, evenement.titre(), evenement.dateHeureDebut(),
                            evenement.lieuAdresseFormatee(), raison);
                        try {
                            emailService.envoyerAnnulationEvenement(contactEmail, ctx);
                            log.debug("Annulation evenement notifiee a l'email general {}", contactEmail);
                        } catch (NotificationEmailException e) {
                            log.error("Echec envoi annulation evenement a {} : {}", contactEmail, e.getMessage());
                        }
                    });
                }
            }
            case "SANS_INSCRIPTION" -> {
                Set<UUID> notifies = new HashSet<>();
                for (PersonneContactInfo b : personneQueryPort.trouverContactsParRole("benevole")) {
                    if (notifies.add(b.id())) {
                        ContexteEvenementEmail ctx = new ContexteEvenementEmail(
                            b.prenom(), evenement.titre(), evenement.dateHeureDebut(),
                            evenement.lieuAdresseFormatee(), raison);
                        envoyerEtTracerReco(b.id(), evenementId,
                            TypeEvenementNotification.ANNULATION_EVENEMENT, sujet,
                            () -> emailService.envoyerAnnulationEvenement(b.email(), ctx));
                    }
                }
                for (PersonneContactInfo p : personneQueryPort.trouverContactsParRole("beneficiaire")) {
                    if (notifies.add(p.id())) {
                        ContexteEvenementEmail ctx = new ContexteEvenementEmail(
                            p.prenom(), evenement.titre(), evenement.dateHeureDebut(),
                            evenement.lieuAdresseFormatee(), raison);
                        envoyerEtTracerReco(p.id(), evenementId,
                            TypeEvenementNotification.ANNULATION_EVENEMENT, sujet,
                            () -> emailService.envoyerAnnulationEvenement(p.email(), ctx));
                    }
                }
            }
            default -> log.warn("modeInscription inconnu : {}", evenement.modeInscription());
        }
    }

    private void envoyerEtTracerReco(
        UUID personneId,
        UUID sessionId,
        TypeEvenementNotification type,
        String sujet,
        Runnable envoi
    ) {
        try {
            envoi.run();
            notificationRepository.save(
                Notification.envoye(personneId, sessionId, type, sujet));
            log.debug("Notification {} envoyee a personne {}", type, personneId);
        } catch (NotificationEmailException e) {
            notificationRepository.save(
                Notification.echec(personneId, sessionId, type, sujet, e.getMessage()));
            log.error("Echec notification {} pour personne {}: {}", type, personneId, e.getMessage());
        }
    }

    private void envoyerEtTracer(
        UUID personneId,
        UUID distributionId,
        TypeEvenementNotification type,
        String sujet,
        Runnable envoi
    ) {
        try {
            envoi.run();
            notificationRepository.save(
                Notification.envoye(personneId, distributionId, type, sujet));
            log.debug("Notification {} envoyee a personne {}", type, personneId);
        } catch (NotificationEmailException e) {
            notificationRepository.save(
                Notification.echec(personneId, distributionId, type, sujet, e.getMessage()));
            log.error("Echec notification {} pour personne {}: {}", type, personneId, e.getMessage());
        }
    }
}
