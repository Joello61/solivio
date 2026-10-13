package com.solivio.api.notification.application;

import com.solivio.api.inscription.events.InscriptionsAnnuleesParDistribution.InscriptionAnnulee;
import com.solivio.api.inscription.events.InscriptionsRetabliesParDistribution.InscriptionConcernee;
import com.solivio.api.notification.application.NotificationEmailService.ContexteCollecteEmail;
import com.solivio.api.notification.application.NotificationEmailService.ContexteEmail;
import com.solivio.api.notification.application.NotificationEmailService.ContexteEvenementEmail;
import com.solivio.api.notification.application.NotificationEmailService.ContexteReconditionnementEmail;
import com.solivio.api.notification.domain.Notification;
import com.solivio.api.notification.domain.TypeEvenementNotification;
import com.solivio.api.notification.infrastructure.email.NotificationEmailException;
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
import java.util.function.BiConsumer;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationEmailService emailService;
    private final NotificationTraceur traceur;
    private final PersonneQueryPort personneQueryPort;
    private final DistributionQueryPort distributionQueryPort;
    private final InscriptionQueryPort inscriptionQueryPort;
    private final SessionReconditionnementQueryPort sessionReconditionnementQueryPort;
    private final MissionCollecteQueryPort missionCollecteQueryPort;
    private final EvenementQueryPort evenementQueryPort;
    private final AssociationQueryPort associationQueryPort;

    public NotificationService(
        NotificationEmailService emailService,
        NotificationTraceur traceur,
        PersonneQueryPort personneQueryPort,
        DistributionQueryPort distributionQueryPort,
        InscriptionQueryPort inscriptionQueryPort,
        SessionReconditionnementQueryPort sessionReconditionnementQueryPort,
        MissionCollecteQueryPort missionCollecteQueryPort,
        EvenementQueryPort evenementQueryPort,
        AssociationQueryPort associationQueryPort
    ) {
        this.emailService = emailService;
        this.traceur = traceur;
        this.personneQueryPort = personneQueryPort;
        this.distributionQueryPort = distributionQueryPort;
        this.inscriptionQueryPort = inscriptionQueryPort;
        this.sessionReconditionnementQueryPort = sessionReconditionnementQueryPort;
        this.missionCollecteQueryPort = missionCollecteQueryPort;
        this.evenementQueryPort = evenementQueryPort;
        this.associationQueryPort = associationQueryPort;
    }

    // occurrenceId distingue deux confirmations successives de la meme inscription
    // (desinscription puis reinscription) ; il vaut null pour une publication anterieure.
    @Transactional
    public void notifierConfirmationInscription(
        UUID personneId, UUID distributionId, String typeInscription, UUID creneauId, UUID occurrenceId
    ) {
        PersonneContactInfo personne = personneQueryPort.trouverPersonneParId(personneId);
        DistributionDetailInfo distribution = distributionQueryPort.trouverDistributionDetails(distributionId);
        ContexteEmail contexte = construireContexte(
            personne.prenom(), typeInscription, creneauId, distributionId, distribution);
        String sujet = "Votre inscription est confirmee - " + distribution.titre();
        TypeEvenementNotification type = TypeEvenementNotification.CONFIRMATION_INSCRIPTION;
        boolean envoye = envoyer(cle(type, occurrenceId), personne.id(), distributionId, type, sujet,
            () -> emailService.envoyerConfirmationInscription(personne.email(), contexte));
        exigerSucces(envoye ? 0 : 1, type, distributionId);
    }

    @Transactional
    public void notifierPromotionListeAttente(
        UUID personneId, UUID distributionId, String typeInscription, UUID creneauId, UUID occurrenceId
    ) {
        PersonneContactInfo personne = personneQueryPort.trouverPersonneParId(personneId);
        DistributionDetailInfo distribution = distributionQueryPort.trouverDistributionDetails(distributionId);
        ContexteEmail contexte = construireContexte(
            personne.prenom(), typeInscription, creneauId, distributionId, distribution);
        String sujet = "Une place est disponible - " + distribution.titre();
        TypeEvenementNotification type = TypeEvenementNotification.PROMOTION_LISTE_ATTENTE;
        boolean envoye = envoyer(cle(type, occurrenceId), personne.id(), distributionId, type, sujet,
            () -> emailService.envoyerPromotionListeAttente(personne.email(), contexte));
        exigerSucces(envoye ? 0 : 1, type, distributionId);
    }

    @Transactional
    public void notifierAnnulationDistribution(UUID distributionId, List<InscriptionAnnulee> inscriptions,
                                               UUID occurrenceId) {
        DistributionDetailInfo distribution = distributionQueryPort.trouverDistributionDetails(distributionId);
        String sujet = "Distribution annulee - " + distribution.titre();
        TypeEvenementNotification type = TypeEvenementNotification.ANNULATION_DISTRIBUTION;
        int echecs = 0;
        for (InscriptionAnnulee inscription : inscriptions) {
            PersonneContactInfo personne = personneQueryPort.trouverPersonneParId(inscription.personneId());
            ContexteEmail contexte = construireContexte(personne.prenom(), inscription.typeInscription(),
                inscription.creneauId(), distributionId, distribution);
            // Cle par occurrence : apres une reactivation, une nouvelle annulation previent a nouveau.
            // Les evenements publies avant l'ajout de l'occurrence gardent la cle par distribution.
            UUID discriminant = occurrenceId != null ? occurrenceId : distributionId;
            if (!envoyer(cle(type, discriminant), personne.id(), distributionId, type, sujet,
                () -> emailService.envoyerAnnulationDistribution(personne.email(), contexte))) {
                echecs++;
            }
        }
        exigerSucces(echecs, type, distributionId);
    }

    // Distribution reactivee : chacun apprend si son inscription est retablie ou s'il doit
    // se reinscrire (inscrit ailleurs la meme semaine entre-temps, RG1).
    @Transactional
    public void notifierReactivationDistribution(UUID distributionId, List<InscriptionConcernee> retablies,
                                                 List<InscriptionConcernee> nonRetablies, UUID occurrenceId) {
        DistributionDetailInfo distribution = distributionQueryPort.trouverDistributionDetails(distributionId);
        String sujet = "Distribution retablie - " + distribution.titre();
        TypeEvenementNotification type = TypeEvenementNotification.REACTIVATION_DISTRIBUTION;
        int echecs = 0;
        for (List<InscriptionConcernee> groupe : List.of(retablies, nonRetablies)) {
            boolean retablie = groupe == retablies;
            for (InscriptionConcernee inscription : groupe) {
                PersonneContactInfo personne = personneQueryPort.trouverPersonneParId(inscription.personneId());
                ContexteEmail contexte = construireContexte(personne.prenom(), inscription.typeInscription(),
                    inscription.creneauId(), distributionId, distribution);
                if (!envoyer(cle(type, occurrenceId), personne.id(), distributionId, type, sujet,
                    () -> emailService.envoyerReactivationDistribution(personne.email(), contexte, retablie))) {
                    echecs++;
                }
            }
        }
        exigerSucces(echecs, type, distributionId);
    }

    // Changement de date, de lieu ou d'horaires : confirmes et liste d'attente sont
    // prevenus, avec les informations a jour (comme pour une annulation, RG6).
    @Transactional
    public void notifierModificationDistribution(UUID distributionId, UUID occurrenceId) {
        DistributionDetailInfo distribution = distributionQueryPort.trouverDistributionDetails(distributionId);
        String sujet = "Distribution modifiee - " + distribution.titre();
        TypeEvenementNotification type = TypeEvenementNotification.MODIFICATION_DISTRIBUTION;
        int echecs = 0;
        for (DestinataireMail dest : inscriptionQueryPort.trouverInscritsActifs(distributionId)) {
            ContexteEmail contexte = construireContexte(
                dest.prenom(), dest.typeInscription(), dest.creneauId(), distributionId, distribution);
            if (!envoyer(cle(type, occurrenceId), dest.personneId(), distributionId, type, sujet,
                () -> emailService.envoyerModificationDistribution(dest.email(), contexte))) {
                echecs++;
            }
        }
        exigerSucces(echecs, type, distributionId);
    }

    @Transactional
    public void notifierDesistementTardifBenevole(UUID personneBenevoleId, UUID distributionId, UUID occurrenceId) {
        PersonneContactInfo benevole = personneQueryPort.trouverPersonneParId(personneBenevoleId);
        DistributionDetailInfo distribution = distributionQueryPort.trouverDistributionDetails(distributionId);
        String sujet = "Desistement tardif benevole - " + distribution.titre();
        TypeEvenementNotification type = TypeEvenementNotification.DESISTEMENT_TARDIF_BENEVOLE;
        int echecs = 0;
        for (PersonneContactInfo coord : personneQueryPort.trouverContactsParRole("coordinateur")) {
            if (!envoyer(cle(type, occurrenceId), coord.id(), distributionId, type, sujet,
                () -> emailService.envoyerDesistementTardifBenevole(
                    coord.email(), coord.prenom(), benevole.prenom(), benevole.nom(), distribution))) {
                echecs++;
            }
        }
        exigerSucces(echecs, type, distributionId);
    }

    @Transactional
    public void notifierRappelVeille(UUID distributionId) {
        DistributionDetailInfo distribution = distributionQueryPort.trouverDistributionDetails(distributionId);
        String sujet = "Rappel : distribution demain - " + distribution.titre();
        TypeEvenementNotification type = TypeEvenementNotification.RAPPEL_VEILLE;
        int echecs = 0;
        for (DestinataireMail dest : inscriptionQueryPort.trouverInscritsConfirmes(distributionId)) {
            ContexteEmail contexte = construireContexte(
                dest.prenom(), dest.typeInscription(), dest.creneauId(), distributionId, distribution);
            if (!envoyer(cle(type, distributionId), dest.personneId(), distributionId, type, sujet,
                () -> emailService.envoyerRappelVeille(dest.email(), contexte))) {
                echecs++;
            }
        }
        exigerSucces(echecs, type, distributionId);
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
    public void notifierConfirmationInscriptionReconditionnement(UUID personneId, UUID sessionId, UUID occurrenceId) {
        PersonneContactInfo personne = personneQueryPort.trouverPersonneParId(personneId);
        SessionInfo session = sessionReconditionnementQueryPort.trouverSessionDetails(sessionId);
        ContexteReconditionnementEmail contexte = new ContexteReconditionnementEmail(
            personne.prenom(), session.titre(), session.dateHeureDebut(),
            session.dateHeureFin(), session.lieu(), null);
        String sujet = "Inscription confirmee - " + session.titre();
        TypeEvenementNotification type = TypeEvenementNotification.CONFIRMATION_INSCRIPTION_RECONDITIONNEMENT;
        // Cle par occurrence : une reinscription apres desistement recoit sa propre confirmation.
        boolean envoye = envoyer(cle(type, occurrenceId), personne.id(), sessionId, type, sujet,
            () -> emailService.envoyerConfirmationInscriptionReconditionnement(personne.email(), contexte));
        exigerSucces(envoye ? 0 : 1, type, sessionId);
    }

    @Transactional
    public void notifierAnnulationSessionReconditionnement(UUID sessionId) {
        SessionInfo session = sessionReconditionnementQueryPort.trouverSessionDetails(sessionId);
        String sujet = "Session annulee - " + session.titre();
        TypeEvenementNotification type = TypeEvenementNotification.ANNULATION_SESSION_RECONDITIONNEMENT;
        int echecs = 0;
        for (UUID personneId : sessionReconditionnementQueryPort.trouverPersonnesInscritesConfirmees(sessionId)) {
            PersonneContactInfo personne = personneQueryPort.trouverPersonneParId(personneId);
            ContexteReconditionnementEmail contexte = new ContexteReconditionnementEmail(
                personne.prenom(), session.titre(), session.dateHeureDebut(),
                session.dateHeureFin(), session.lieu(), null);
            if (!envoyer(cle(type, sessionId), personne.id(), sessionId, type, sujet,
                () -> emailService.envoyerAnnulationSessionReconditionnement(personne.email(), contexte))) {
                echecs++;
            }
        }
        exigerSucces(echecs, type, sessionId);
    }

    @Transactional
    public void notifierCreationMissionCollecte(UUID missionId) {
        MissionInfo mission = missionCollecteQueryPort.trouverMissionDetails(missionId);
        String sujet = "Nouvelle mission de collecte - " + mission.titre();
        TypeEvenementNotification type = TypeEvenementNotification.CREATION_MISSION_COLLECTE;
        int echecs = 0;
        for (PersonneContactInfo benevole : personneQueryPort.trouverContactsParRole("benevole")) {
            ContexteCollecteEmail contexte = new ContexteCollecteEmail(
                benevole.prenom(), mission.titre(), mission.dateHeure(),
                mission.lieuCollecteAdresse(), mission.lieuDepotAdresse(), null);
            if (!envoyer(cle(type, missionId), benevole.id(), missionId, type, sujet,
                () -> emailService.envoyerCreationMissionCollecte(benevole.email(), contexte))) {
                echecs++;
            }
        }
        exigerSucces(echecs, type, missionId);
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
        TypeEvenementNotification type = TypeEvenementNotification.ANNULATION_MISSION_COLLECTE;
        boolean envoye = envoyer(cle(type, missionId), benevole.id(), missionId, type, sujet,
            () -> emailService.envoyerAnnulationMissionCollecte(benevole.email(), contexte));
        exigerSucces(envoye ? 0 : 1, type, missionId);
    }

    @Transactional
    public void notifierPublicationEvenement(UUID evenementId) {
        EvenementInfo evenement = evenementQueryPort.trouverEvenementDetails(evenementId);
        DiffusionEvenement diffusion = new DiffusionEvenement(evenementId, evenement,
            TypeEvenementNotification.PUBLICATION_EVENEMENT, "Nouvel evenement - " + evenement.titre(),
            null, emailService::envoyerPublicationEvenement);

        if (evenement.aBesoiNStaff()) {
            diffusion.envoyerA(personneQueryPort.trouverContactsParRole("benevole"));
        }
        if (evenement.ouvertParticipants() && evenement.publicParticipants() != null) {
            switch (evenement.publicParticipants()) {
                case "BENEVOLES" -> diffusion.envoyerA(personneQueryPort.trouverContactsParRole("benevole"));
                case "BENEFICIAIRES" ->
                    diffusion.envoyerA(personneQueryPort.trouverContactsParRole("beneficiaire"));
                case "TOUS" -> {
                    diffusion.envoyerA(personneQueryPort.trouverContactsParRole("benevole"));
                    diffusion.envoyerA(personneQueryPort.trouverContactsParRole("beneficiaire"));
                }
                default -> log.warn("publicParticipants inconnu : {}", evenement.publicParticipants());
            }
        }
        exigerSucces(diffusion.echecs, TypeEvenementNotification.PUBLICATION_EVENEMENT, evenementId);
    }

    @Transactional
    public void notifierAnnulationEvenement(UUID evenementId) {
        EvenementInfo evenement = evenementQueryPort.trouverEvenementDetails(evenementId);
        DiffusionEvenement diffusion = new DiffusionEvenement(evenementId, evenement,
            TypeEvenementNotification.ANNULATION_EVENEMENT, "Evenement annule - " + evenement.titre(),
            evenement.raisonAnnulation(), emailService::envoyerAnnulationEvenement);

        switch (evenement.modeInscription()) {
            case "OBLIGATOIRE", "LIBRE" -> {
                diffusion.envoyerA(evenementQueryPort.trouverInscrits(evenementId).stream()
                    .map(personneQueryPort::trouverPersonneParId)
                    .toList());
                if ("LIBRE".equals(evenement.modeInscription())) {
                    notifierEmailGeneral(evenementId, evenement);
                }
            }
            case "SANS_INSCRIPTION" -> {
                diffusion.envoyerA(personneQueryPort.trouverContactsParRole("benevole"));
                diffusion.envoyerA(personneQueryPort.trouverContactsParRole("beneficiaire"));
            }
            default -> log.warn("modeInscription inconnu : {}", evenement.modeInscription());
        }
        exigerSucces(diffusion.echecs, TypeEvenementNotification.ANNULATION_EVENEMENT, evenementId);
    }

    // Sans personne associee, cet envoi n'est ni trace ni protege par la cle : son
    // echec ne fait pas relancer l'ecouteur, et une relance due a un autre echec le
    // renvoie.
    private void notifierEmailGeneral(UUID evenementId, EvenementInfo evenement) {
        associationQueryPort.trouverContactEmail().ifPresent(contactEmail -> {
            ContexteEvenementEmail ctx = new ContexteEvenementEmail(
                null, evenement.titre(), evenement.dateHeureDebut(),
                evenement.lieuAdresseFormatee(), evenement.raisonAnnulation());
            try {
                emailService.envoyerAnnulationEvenement(contactEmail, ctx);
                log.debug("Annulation de l'evenement {} notifiee a l'email general", evenementId);
            } catch (NotificationEmailException e) {
                log.error("Echec envoi a l'email general de l'annulation de l'evenement {} : {}",
                    evenementId, e.getMessage());
            }
        });
    }

    /** Envoi d'un email lie a un evenement, une seule fois par personne, avec compte des echecs. */
    private final class DiffusionEvenement {

        private final UUID evenementId;
        private final EvenementInfo evenement;
        private final TypeEvenementNotification type;
        private final String sujet;
        private final String raison;
        private final BiConsumer<String, ContexteEvenementEmail> envoi;
        private final Set<UUID> notifies = new HashSet<>();
        private int echecs;

        private DiffusionEvenement(UUID evenementId, EvenementInfo evenement, TypeEvenementNotification type,
                                   String sujet, String raison, BiConsumer<String, ContexteEvenementEmail> envoi) {
            this.evenementId = evenementId;
            this.evenement = evenement;
            this.type = type;
            this.sujet = sujet;
            this.raison = raison;
            this.envoi = envoi;
        }

        private void envoyerA(List<PersonneContactInfo> personnes) {
            for (PersonneContactInfo p : personnes) {
                if (!notifies.add(p.id())) {
                    continue;
                }
                ContexteEvenementEmail ctx = new ContexteEvenementEmail(
                    p.prenom(), evenement.titre(), evenement.dateHeureDebut(),
                    evenement.lieuAdresseFormatee(), raison);
                if (!envoyer(cle(type, evenementId), p.id(), evenementId, type, sujet,
                    () -> envoi.accept(p.email(), ctx))) {
                    echecs++;
                }
            }
        }
    }

    private static String cle(TypeEvenementNotification type, UUID discriminant) {
        return discriminant == null ? null : type + ":" + discriminant;
    }

    /**
     * Envoie l'email sauf s'il est deja parti pour cette cle, puis trace le resultat.
     * Renvoie false en cas d'echec SMTP.
     */
    private boolean envoyer(
        String cle,
        UUID personneId,
        UUID referenceId,
        TypeEvenementNotification type,
        String sujet,
        Runnable envoi
    ) {
        if (traceur.dejaEnvoyee(cle, personneId)) {
            log.debug("Notification {} deja envoyee a personne {}", type, personneId);
            return true;
        }
        try {
            envoi.run();
            traceur.tracer(Notification.envoye(cle, personneId, referenceId, type, sujet));
            log.debug("Notification {} envoyee a personne {}", type, personneId);
            return true;
        } catch (NotificationEmailException e) {
            traceur.tracer(Notification.echec(cle, personneId, referenceId, type, sujet, e.getMessage()));
            log.error("Echec notification {} pour personne {}: {}", type, personneId, e.getMessage());
            return false;
        }
    }

    private static void exigerSucces(int echecs, TypeEvenementNotification type, UUID referenceId) {
        if (echecs > 0) {
            throw new NotificationsIncompletesException(type, referenceId, echecs);
        }
    }
}
