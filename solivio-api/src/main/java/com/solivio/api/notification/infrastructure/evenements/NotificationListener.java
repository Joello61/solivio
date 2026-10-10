package com.solivio.api.notification.infrastructure.evenements;

import com.solivio.api.collecte.events.MissionCollecteAnnulee;
import com.solivio.api.collecte.events.MissionCollecteCreee;
import com.solivio.api.evenement.events.EvenementAnnule;
import com.solivio.api.evenement.events.EvenementPublie;
import com.solivio.api.inscription.events.DesistementTardifBenevole;
import com.solivio.api.inscription.events.InscriptionConfirmee;
import com.solivio.api.inscription.events.InscriptionPromue;
import com.solivio.api.inscription.events.InscriptionsAnnuleesParDistribution;
import com.solivio.api.notification.application.NotificationService;
import com.solivio.api.reconditionnement.events.SessionReconditionnementAnnulee;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

/**
 * Traduit les evenements des autres modules en emails. Chaque methode s'execute
 * apres validation de la transaction emettrice, de facon asynchrone ; une
 * exception (dont NotificationsIncompletesException) laisse la publication en
 * echec pour qu'elle soit relancee. La livraison est garantie au moins une fois
 * (ADR-003) ; la cle d'idempotence de chaque notification evite les doublons.
 */
@Component
public class NotificationListener {

    private final NotificationService notificationService;

    public NotificationListener(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @ApplicationModuleListener
    void on(InscriptionConfirmee event) {
        notificationService.notifierConfirmationInscription(
            event.personneId(), event.distributionId(), event.typeInscription(), event.creneauId(),
            event.occurrenceId());
    }

    @ApplicationModuleListener
    void on(InscriptionPromue event) {
        notificationService.notifierPromotionListeAttente(
            event.personneId(), event.distributionId(), event.typeInscription(), event.creneauId(),
            event.occurrenceId());
    }

    @ApplicationModuleListener
    void on(DesistementTardifBenevole event) {
        notificationService.notifierDesistementTardifBenevole(
            event.personneId(), event.distributionId(), event.occurrenceId());
    }

    // On ecoute l'annulation des inscriptions, et non DistributionAnnulee : lire les
    // inscrits en parallele du module inscription pourrait arriver apres leur annulation.
    @ApplicationModuleListener
    void on(InscriptionsAnnuleesParDistribution event) {
        notificationService.notifierAnnulationDistribution(event.distributionId(), event.inscriptions());
    }

    @ApplicationModuleListener
    void on(EvenementPublie event) {
        notificationService.notifierPublicationEvenement(event.evenementId());
    }

    @ApplicationModuleListener
    void on(EvenementAnnule event) {
        notificationService.notifierAnnulationEvenement(event.evenementId());
    }

    @ApplicationModuleListener
    void on(MissionCollecteCreee event) {
        notificationService.notifierCreationMissionCollecte(event.missionId());
    }

    @ApplicationModuleListener
    void on(MissionCollecteAnnulee event) {
        notificationService.notifierAnnulationMissionCollecte(event.missionId(), event.benevoleId());
    }

    @ApplicationModuleListener
    void on(SessionReconditionnementAnnulee event) {
        notificationService.notifierAnnulationSessionReconditionnement(event.sessionId());
    }

    @ApplicationModuleListener
    void on(RappelVeille event) {
        notificationService.notifierRappelVeille(event.distributionId());
    }
}
