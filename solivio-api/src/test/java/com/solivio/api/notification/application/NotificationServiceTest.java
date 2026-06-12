package com.solivio.api.notification.application;

import com.solivio.api.notification.application.NotificationEmailService.ContexteEmail;
import com.solivio.api.notification.domain.Notification;
import com.solivio.api.notification.domain.StatutNotification;
import com.solivio.api.notification.domain.TypeEvenementNotification;
import com.solivio.api.notification.infrastructure.email.NotificationEmailException;
import com.solivio.api.notification.infrastructure.persistence.NotificationRepository;
import com.solivio.api.shared.distribution.DistributionQueryPort;
import com.solivio.api.shared.distribution.DistributionQueryPort.DistributionDetailInfo;
import com.solivio.api.shared.identity.PersonneQueryPort;
import com.solivio.api.shared.identity.PersonneQueryPort.PersonneContactInfo;
import com.solivio.api.shared.inscription.InscriptionQueryPort;
import com.solivio.api.shared.inscription.InscriptionQueryPort.DestinataireMail;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationEmailService emailService;
    @Mock private NotificationRepository notificationRepository;
    @Mock private PersonneQueryPort personneQueryPort;
    @Mock private DistributionQueryPort distributionQueryPort;
    @Mock private InscriptionQueryPort inscriptionQueryPort;
    @Mock private com.solivio.api.shared.reconditionnement.SessionReconditionnementQueryPort sessionReconditionnementQueryPort;
    @Mock private com.solivio.api.shared.collecte.MissionCollecteQueryPort missionCollecteQueryPort;
    @Mock private com.solivio.api.shared.evenement.EvenementQueryPort evenementQueryPort;
    @Mock private com.solivio.api.shared.association.AssociationQueryPort associationQueryPort;

    private NotificationService service;

    private UUID personneId;
    private UUID distributionId;
    private PersonneContactInfo personne;
    private DistributionDetailInfo distribution;

    @BeforeEach
    void setUp() {
        service = new NotificationService(
            emailService, notificationRepository,
            personneQueryPort, distributionQueryPort, inscriptionQueryPort,
            sessionReconditionnementQueryPort, missionCollecteQueryPort,
            evenementQueryPort, associationQueryPort
        );
        personneId = UUID.randomUUID();
        distributionId = UUID.randomUUID();
        personne = new PersonneContactInfo(personneId, "marie@example.com", "Marie", "Dupont");
        distribution = new DistributionDetailInfo(
            distributionId, "Distribution mai", LocalDate.of(2025, 5, 15), "Salle A", null);
    }

    @Test
    void notifierConfirmationInscription_envoieEmailEtTrace() {
        when(personneQueryPort.trouverPersonneParId(personneId)).thenReturn(personne);
        when(distributionQueryPort.trouverDistributionDetails(distributionId)).thenReturn(distribution);

        service.notifierConfirmationInscription(personneId, distributionId, "BENEFICIAIRE", null);

        verify(emailService).envoyerConfirmationInscription(
            eq("marie@example.com"), any(ContexteEmail.class));
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification trace = captor.getValue();
        assertThat(trace.getStatut()).isEqualTo(StatutNotification.ENVOYE);
        assertThat(trace.getTypeEvenement()).isEqualTo(TypeEvenementNotification.CONFIRMATION_INSCRIPTION);
        assertThat(trace.getPersonneId()).isEqualTo(personneId);
        assertThat(trace.getDistributionId()).isEqualTo(distributionId);
    }

    @Test
    void notifierConfirmationInscription_benevole_contexteMarqueBenevole() {
        when(personneQueryPort.trouverPersonneParId(personneId)).thenReturn(personne);
        when(distributionQueryPort.trouverDistributionDetails(distributionId)).thenReturn(distribution);

        service.notifierConfirmationInscription(personneId, distributionId, "BENEVOLE", null);

        ArgumentCaptor<ContexteEmail> captor = ArgumentCaptor.forClass(ContexteEmail.class);
        verify(emailService).envoyerConfirmationInscription(eq("marie@example.com"), captor.capture());
        assertThat(captor.getValue().estBenevole()).isTrue();
        assertThat(captor.getValue().heureArriveeBenevole()).isNull();
    }

    @Test
    void notifierConfirmationInscription_echecSMTP_traceEchec() {
        when(personneQueryPort.trouverPersonneParId(personneId)).thenReturn(personne);
        when(distributionQueryPort.trouverDistributionDetails(distributionId)).thenReturn(distribution);
        doThrow(new NotificationEmailException("marie@example.com", "sujet", new RuntimeException("SMTP KO")))
            .when(emailService).envoyerConfirmationInscription(anyString(), any(ContexteEmail.class));

        service.notifierConfirmationInscription(personneId, distributionId, "BENEFICIAIRE", null);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertThat(captor.getValue().getStatut()).isEqualTo(StatutNotification.ECHEC);
        assertThat(captor.getValue().getErreur()).isNotBlank();
    }

    @Test
    void notifierPromotionListeAttente_envoieEmailEtTrace() {
        when(personneQueryPort.trouverPersonneParId(personneId)).thenReturn(personne);
        when(distributionQueryPort.trouverDistributionDetails(distributionId)).thenReturn(distribution);

        service.notifierPromotionListeAttente(personneId, distributionId, "BENEFICIAIRE", null);

        verify(emailService).envoyerPromotionListeAttente(
            eq("marie@example.com"), any(ContexteEmail.class));
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertThat(captor.getValue().getTypeEvenement())
            .isEqualTo(TypeEvenementNotification.PROMOTION_LISTE_ATTENTE);
    }

    @Test
    void notifierAnnulationDistribution_envoieEmailATousLesInscrits() {
        DestinataireMail dest1 = new DestinataireMail(
            UUID.randomUUID(), "a@ex.com", "Alice", "BENEFICIAIRE", null);
        DestinataireMail dest2 = new DestinataireMail(
            UUID.randomUUID(), "b@ex.com", "Bob", "BENEVOLE", null);
        when(distributionQueryPort.trouverDistributionDetails(distributionId)).thenReturn(distribution);
        when(inscriptionQueryPort.trouverInscritsConfirmes(distributionId))
            .thenReturn(List.of(dest1, dest2));

        service.notifierAnnulationDistribution(distributionId);

        verify(emailService).envoyerAnnulationDistribution(eq("a@ex.com"), any(ContexteEmail.class));
        verify(emailService).envoyerAnnulationDistribution(eq("b@ex.com"), any(ContexteEmail.class));
        verify(notificationRepository, times(2)).save(any(Notification.class));
    }

    @Test
    void notifierAnnulationDistribution_aucunInscrit_nEnvoiePasDemail() {
        when(distributionQueryPort.trouverDistributionDetails(distributionId)).thenReturn(distribution);
        when(inscriptionQueryPort.trouverInscritsConfirmes(distributionId)).thenReturn(List.of());

        service.notifierAnnulationDistribution(distributionId);

        verify(emailService, never()).envoyerAnnulationDistribution(anyString(), any());
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void notifierRappelVeille_envoieRappelATousLesInscrits() {
        DestinataireMail dest = new DestinataireMail(
            UUID.randomUUID(), "c@ex.com", "Claire", "BENEFICIAIRE", null);
        when(distributionQueryPort.trouverDistributionDetails(distributionId)).thenReturn(distribution);
        when(inscriptionQueryPort.trouverInscritsConfirmes(distributionId)).thenReturn(List.of(dest));

        service.notifierRappelVeille(distributionId);

        verify(emailService).envoyerRappelVeille(eq("c@ex.com"), any(ContexteEmail.class));
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertThat(captor.getValue().getTypeEvenement()).isEqualTo(TypeEvenementNotification.RAPPEL_VEILLE);
    }
}
