package com.solivio.api.notification.application;

import com.solivio.api.inscription.events.InscriptionsAnnuleesParDistribution.InscriptionAnnulee;
import com.solivio.api.inscription.events.InscriptionsRetabliesParDistribution.InscriptionConcernee;
import com.solivio.api.notification.application.NotificationEmailService.ContexteCollecteEmail;
import com.solivio.api.notification.application.NotificationEmailService.ContexteEmail;
import com.solivio.api.notification.application.NotificationEmailService.ContexteEvenementEmail;
import com.solivio.api.notification.application.NotificationEmailService.ContexteReconditionnementEmail;
import com.solivio.api.notification.domain.Notification;
import com.solivio.api.notification.domain.StatutNotification;
import com.solivio.api.notification.domain.TypeEvenementNotification;
import com.solivio.api.notification.infrastructure.email.NotificationEmailException;
import com.solivio.api.shared.collecte.MissionCollecteQueryPort;
import com.solivio.api.shared.collecte.MissionCollecteQueryPort.MissionInfo;
import com.solivio.api.shared.distribution.DistributionQueryPort;
import com.solivio.api.shared.distribution.DistributionQueryPort.CreneauInfo;
import com.solivio.api.shared.distribution.DistributionQueryPort.DistributionDetailInfo;
import com.solivio.api.shared.evenement.EvenementQueryPort;
import com.solivio.api.shared.evenement.EvenementQueryPort.EvenementInfo;
import com.solivio.api.shared.identity.PersonneQueryPort;
import com.solivio.api.shared.identity.PersonneQueryPort.PersonneContactInfo;
import com.solivio.api.shared.inscription.InscriptionQueryPort;
import com.solivio.api.shared.inscription.InscriptionQueryPort.DestinataireMail;
import com.solivio.api.shared.reconditionnement.SessionReconditionnementQueryPort;
import com.solivio.api.shared.reconditionnement.SessionReconditionnementQueryPort.SessionInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationEmailService emailService;
    @Mock private NotificationTraceur traceur;
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
            emailService, traceur,
            personneQueryPort, distributionQueryPort, inscriptionQueryPort,
            sessionReconditionnementQueryPort, missionCollecteQueryPort,
            evenementQueryPort, associationQueryPort
        );
        personneId = UUID.randomUUID();
        distributionId = UUID.randomUUID();
        personne = new PersonneContactInfo(personneId, "marie@example.com", "Marie", "Dupont");
        distribution = new DistributionDetailInfo(
            distributionId, "Distribution mai", LocalDate.of(2025, 5, 15), "Salle A", null, "PUBLIEE", null);
    }

    @Test
    void notifierConfirmationInscription_envoieEmailEtTrace() {
        when(personneQueryPort.trouverPersonneParId(personneId)).thenReturn(personne);
        when(distributionQueryPort.trouverDistributionDetails(distributionId)).thenReturn(distribution);

        service.notifierConfirmationInscription(personneId, distributionId, "BENEFICIAIRE", null, UUID.randomUUID());

        verify(emailService).envoyerConfirmationInscription(
            eq("marie@example.com"), any(ContexteEmail.class));
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(traceur).tracer(captor.capture());
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

        service.notifierConfirmationInscription(personneId, distributionId, "BENEVOLE", null, UUID.randomUUID());

        ArgumentCaptor<ContexteEmail> captor = ArgumentCaptor.forClass(ContexteEmail.class);
        verify(emailService).envoyerConfirmationInscription(eq("marie@example.com"), captor.capture());
        assertThat(captor.getValue().estBenevole()).isTrue();
        assertThat(captor.getValue().heureArriveeBenevole()).isNull();
    }

    @Test
    void notifierConfirmationInscription_echecSMTP_traceEchecEtLeveException() {
        when(personneQueryPort.trouverPersonneParId(personneId)).thenReturn(personne);
        when(distributionQueryPort.trouverDistributionDetails(distributionId)).thenReturn(distribution);
        doThrow(new NotificationEmailException(new RuntimeException("SMTP KO")))
            .when(emailService).envoyerConfirmationInscription(anyString(), any(ContexteEmail.class));

        assertThatThrownBy(() -> service.notifierConfirmationInscription(
            personneId, distributionId, "BENEFICIAIRE", null, UUID.randomUUID()))
            .isInstanceOf(NotificationsIncompletesException.class);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(traceur).tracer(captor.capture());
        assertThat(captor.getValue().getStatut()).isEqualTo(StatutNotification.ECHEC);
        assertThat(captor.getValue().getErreur()).isNotBlank();
    }

    @Test
    void notifierPromotionListeAttente_envoieEmailEtTrace() {
        when(personneQueryPort.trouverPersonneParId(personneId)).thenReturn(personne);
        when(distributionQueryPort.trouverDistributionDetails(distributionId)).thenReturn(distribution);

        service.notifierPromotionListeAttente(personneId, distributionId, "BENEFICIAIRE", null, UUID.randomUUID());

        verify(emailService).envoyerPromotionListeAttente(
            eq("marie@example.com"), any(ContexteEmail.class));
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(traceur).tracer(captor.capture());
        assertThat(captor.getValue().getTypeEvenement())
            .isEqualTo(TypeEvenementNotification.PROMOTION_LISTE_ATTENTE);
    }

    @Test
    void notifierAnnulationDistribution_envoieEmailAChaqueInscriptionAnnulee() {
        UUID aliceId = UUID.randomUUID();
        UUID bobId = UUID.randomUUID();
        when(distributionQueryPort.trouverDistributionDetails(distributionId)).thenReturn(distribution);
        when(personneQueryPort.trouverPersonneParId(aliceId))
            .thenReturn(new PersonneContactInfo(aliceId, "a@ex.com", "Alice", "A"));
        when(personneQueryPort.trouverPersonneParId(bobId))
            .thenReturn(new PersonneContactInfo(bobId, "b@ex.com", "Bob", "B"));

        service.notifierAnnulationDistribution(distributionId, List.of(
            new InscriptionAnnulee(UUID.randomUUID(), aliceId, "BENEFICIAIRE", null),
            new InscriptionAnnulee(UUID.randomUUID(), bobId, "BENEVOLE", null)), UUID.randomUUID());

        verify(emailService).envoyerAnnulationDistribution(eq("a@ex.com"), any(ContexteEmail.class));
        verify(emailService).envoyerAnnulationDistribution(eq("b@ex.com"), any(ContexteEmail.class));
        verify(traceur, times(2)).tracer(any(Notification.class));
    }

    @Test
    void notifierAnnulationDistribution_aucuneInscription_nEnvoiePasDemail() {
        when(distributionQueryPort.trouverDistributionDetails(distributionId)).thenReturn(distribution);

        service.notifierAnnulationDistribution(distributionId, List.of(), UUID.randomUUID());

        verify(emailService, never()).envoyerAnnulationDistribution(anyString(), any());
        verify(traceur, never()).tracer(any());
    }

    @Test
    void notifierReactivationDistribution_distingueInscriptionsRetabliesEtNonRetablies() {
        UUID aliceId = UUID.randomUUID();
        UUID bobId = UUID.randomUUID();
        UUID occurrenceId = UUID.randomUUID();
        when(distributionQueryPort.trouverDistributionDetails(distributionId)).thenReturn(distribution);
        when(personneQueryPort.trouverPersonneParId(aliceId))
            .thenReturn(new PersonneContactInfo(aliceId, "a@ex.com", "Alice", "A"));
        when(personneQueryPort.trouverPersonneParId(bobId))
            .thenReturn(new PersonneContactInfo(bobId, "b@ex.com", "Bob", "B"));

        service.notifierReactivationDistribution(distributionId,
            List.of(new InscriptionConcernee(UUID.randomUUID(), aliceId, "BENEFICIAIRE", null)),
            List.of(new InscriptionConcernee(UUID.randomUUID(), bobId, "BENEFICIAIRE", null)), occurrenceId);

        verify(emailService).envoyerReactivationDistribution(eq("a@ex.com"), any(ContexteEmail.class), eq(true));
        verify(emailService).envoyerReactivationDistribution(eq("b@ex.com"), any(ContexteEmail.class), eq(false));
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(traceur, times(2)).tracer(captor.capture());
        assertThat(captor.getAllValues()).allSatisfy(n -> {
            assertThat(n.getTypeEvenement()).isEqualTo(TypeEvenementNotification.REACTIVATION_DISTRIBUTION);
            assertThat(n.getCleIdempotence()).isEqualTo("REACTIVATION_DISTRIBUTION:" + occurrenceId);
        });
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
        verify(traceur).tracer(captor.capture());
        assertThat(captor.getValue().getTypeEvenement()).isEqualTo(TypeEvenementNotification.RAPPEL_VEILLE);
    }

    @Test
    void notifierConfirmationInscription_avecCreneau_integreHeuresCreneauDansContexte() {
        UUID creneauId = UUID.randomUUID();
        CreneauInfo creneau = new CreneauInfo(creneauId, 20, LocalTime.of(9, 0), LocalTime.of(10, 0));
        when(personneQueryPort.trouverPersonneParId(personneId)).thenReturn(personne);
        when(distributionQueryPort.trouverDistributionDetails(distributionId)).thenReturn(distribution);
        when(distributionQueryPort.trouverCreneau(creneauId, distributionId)).thenReturn(creneau);

        service.notifierConfirmationInscription(personneId, distributionId, "BENEFICIAIRE", creneauId, UUID.randomUUID());

        ArgumentCaptor<ContexteEmail> captor = ArgumentCaptor.forClass(ContexteEmail.class);
        verify(emailService).envoyerConfirmationInscription(eq("marie@example.com"), captor.capture());
        assertThat(captor.getValue().heureArriveeBenevole()).isNull();
    }

    @Test
    void notifierDesistementTardifBenevole_notifieLeCoordinateur() {
        UUID coordId = UUID.randomUUID();
        PersonneContactInfo coord = new PersonneContactInfo(coordId, "coord@ex.com", "Luc", "Martin");
        when(personneQueryPort.trouverPersonneParId(personneId)).thenReturn(personne);
        when(distributionQueryPort.trouverDistributionDetails(distributionId)).thenReturn(distribution);
        when(personneQueryPort.trouverContactsParRole("coordinateur")).thenReturn(List.of(coord));

        service.notifierDesistementTardifBenevole(personneId, distributionId, UUID.randomUUID());

        verify(emailService).envoyerDesistementTardifBenevole(
            eq("coord@ex.com"), eq("Luc"), eq("Marie"), eq("Dupont"), any(DistributionDetailInfo.class));
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(traceur).tracer(captor.capture());
        assertThat(captor.getValue().getTypeEvenement())
            .isEqualTo(TypeEvenementNotification.DESISTEMENT_TARDIF_BENEVOLE);
        assertThat(captor.getValue().getPersonneId()).isEqualTo(coordId);
    }

    @Test
    void notifierConfirmationInscriptionReconditionnement_envoieEtTrace() {
        UUID sessionId = UUID.randomUUID();
        SessionInfo session = new SessionInfo(
            sessionId, "Session mai", ZonedDateTime.now(), ZonedDateTime.now().plusHours(2), "Entrepot A");
        when(personneQueryPort.trouverPersonneParId(personneId)).thenReturn(personne);
        when(sessionReconditionnementQueryPort.trouverSessionDetails(sessionId)).thenReturn(session);

        UUID occurrenceId = UUID.randomUUID();
        service.notifierConfirmationInscriptionReconditionnement(personneId, sessionId, occurrenceId);

        verify(emailService).envoyerConfirmationInscriptionReconditionnement(
            eq("marie@example.com"), any(ContexteReconditionnementEmail.class));
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(traceur).tracer(captor.capture());
        assertThat(captor.getValue().getTypeEvenement())
            .isEqualTo(TypeEvenementNotification.CONFIRMATION_INSCRIPTION_RECONDITIONNEMENT);
        assertThat(captor.getValue().getStatut()).isEqualTo(StatutNotification.ENVOYE);
        assertThat(captor.getValue().getCleIdempotence())
            .isEqualTo("CONFIRMATION_INSCRIPTION_RECONDITIONNEMENT:" + occurrenceId);
    }

    @Test
    void notifierAnnulationSessionReconditionnement_notifieInscrits() {
        UUID sessionId = UUID.randomUUID();
        UUID inscritId = UUID.randomUUID();
        PersonneContactInfo inscrit = new PersonneContactInfo(inscritId, "i@ex.com", "Paul", "Renard");
        SessionInfo session = new SessionInfo(
            sessionId, "Session annulee", ZonedDateTime.now(), ZonedDateTime.now().plusHours(2), "Entrepot B");
        when(sessionReconditionnementQueryPort.trouverSessionDetails(sessionId)).thenReturn(session);
        when(sessionReconditionnementQueryPort.trouverPersonnesInscritesConfirmees(sessionId))
            .thenReturn(List.of(inscritId));
        when(personneQueryPort.trouverPersonneParId(inscritId)).thenReturn(inscrit);

        service.notifierAnnulationSessionReconditionnement(sessionId);

        verify(emailService).envoyerAnnulationSessionReconditionnement(
            eq("i@ex.com"), any(ContexteReconditionnementEmail.class));
        verify(traceur).tracer(any(Notification.class));
    }

    @Test
    void notifierAnnulationSessionReconditionnement_sansInscrits_nEnvoiePas() {
        UUID sessionId = UUID.randomUUID();
        SessionInfo session = new SessionInfo(
            sessionId, "Session vide", ZonedDateTime.now(), ZonedDateTime.now().plusHours(2), null);
        when(sessionReconditionnementQueryPort.trouverSessionDetails(sessionId)).thenReturn(session);
        when(sessionReconditionnementQueryPort.trouverPersonnesInscritesConfirmees(sessionId))
            .thenReturn(List.of());

        service.notifierAnnulationSessionReconditionnement(sessionId);

        verify(emailService, never()).envoyerAnnulationSessionReconditionnement(anyString(), any());
        verify(traceur, never()).tracer(any());
    }

    @Test
    void notifierCreationMissionCollecte_notifieBenevoles() {
        UUID missionId = UUID.randomUUID();
        UUID b1Id = UUID.randomUUID();
        PersonneContactInfo b1 = new PersonneContactInfo(b1Id, "b1@ex.com", "Ana", "Blanc");
        MissionInfo mission = new MissionInfo(missionId, "Collecte banque", ZonedDateTime.now(),
            "12 rue de la Paix", "Entrepot central");
        when(missionCollecteQueryPort.trouverMissionDetails(missionId)).thenReturn(mission);
        when(personneQueryPort.trouverContactsParRole("benevole")).thenReturn(List.of(b1));

        service.notifierCreationMissionCollecte(missionId);

        verify(emailService).envoyerCreationMissionCollecte(eq("b1@ex.com"), any(ContexteCollecteEmail.class));
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(traceur).tracer(captor.capture());
        assertThat(captor.getValue().getTypeEvenement())
            .isEqualTo(TypeEvenementNotification.CREATION_MISSION_COLLECTE);
    }

    @Test
    void notifierAnnulationMissionCollecte_avecBenevoleAssigne_notifie() {
        UUID missionId = UUID.randomUUID();
        UUID benevoleId = UUID.randomUUID();
        PersonneContactInfo benevole = new PersonneContactInfo(benevoleId, "bev@ex.com", "Tom", "Noir");
        MissionInfo mission = new MissionInfo(missionId, "Collecte annulee", ZonedDateTime.now(),
            "Adresse collecte", "Adresse depot");
        when(missionCollecteQueryPort.trouverMissionDetails(missionId)).thenReturn(mission);
        when(personneQueryPort.trouverPersonneParId(benevoleId)).thenReturn(benevole);

        service.notifierAnnulationMissionCollecte(missionId, benevoleId);

        verify(emailService).envoyerAnnulationMissionCollecte(eq("bev@ex.com"), any(ContexteCollecteEmail.class));
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(traceur).tracer(captor.capture());
        assertThat(captor.getValue().getTypeEvenement())
            .isEqualTo(TypeEvenementNotification.ANNULATION_MISSION_COLLECTE);
    }

    @Test
    void notifierAnnulationMissionCollecte_sansBenevoleAssigne_nEnvoiePas() {
        service.notifierAnnulationMissionCollecte(UUID.randomUUID(), null);

        verify(emailService, never()).envoyerAnnulationMissionCollecte(anyString(), any());
        verify(traceur, never()).tracer(any());
    }

    // --- publication evenement ---

    @Test
    void notifierPublicationEvenement_avecBesoiNStaff_notifieBenevoles() {
        UUID evenementId = UUID.randomUUID();
        UUID b1Id = UUID.randomUUID();
        PersonneContactInfo b1 = new PersonneContactInfo(b1Id, "b1@ev.com", "Bob", "Vert");
        EvenementInfo info = new EvenementInfo(evenementId, "Stand ete", ZonedDateTime.now(),
            "Parc", true, false, null, "OBLIGATOIRE", null);
        when(evenementQueryPort.trouverEvenementDetails(evenementId)).thenReturn(info);
        when(personneQueryPort.trouverContactsParRole("benevole")).thenReturn(List.of(b1));

        service.notifierPublicationEvenement(evenementId);

        verify(emailService).envoyerPublicationEvenement(eq("b1@ev.com"), any(ContexteEvenementEmail.class));
        verify(traceur).tracer(any(Notification.class));
    }

    @Test
    void notifierPublicationEvenement_publicBeneficiaires_notifieBeneficiaires() {
        UUID evenementId = UUID.randomUUID();
        UUID pId = UUID.randomUUID();
        PersonneContactInfo p = new PersonneContactInfo(pId, "p@ev.com", "Eve", "Bleu");
        EvenementInfo info = new EvenementInfo(evenementId, "Fete", ZonedDateTime.now(),
            "Salle", false, true, "BENEFICIAIRES", "LIBRE", null);
        when(evenementQueryPort.trouverEvenementDetails(evenementId)).thenReturn(info);
        when(personneQueryPort.trouverContactsParRole("beneficiaire")).thenReturn(List.of(p));

        service.notifierPublicationEvenement(evenementId);

        verify(emailService).envoyerPublicationEvenement(eq("p@ev.com"), any(ContexteEvenementEmail.class));
        verify(traceur).tracer(any(Notification.class));
    }

    @Test
    void notifierPublicationEvenement_publicTous_notifieBenevolesBeneficiaires() {
        UUID evenementId = UUID.randomUUID();
        UUID b1Id = UUID.randomUUID();
        UUID p1Id = UUID.randomUUID();
        PersonneContactInfo b1 = new PersonneContactInfo(b1Id, "b1@ev.com", "Ben", "Un");
        PersonneContactInfo p1 = new PersonneContactInfo(p1Id, "p1@ev.com", "Pat", "Deux");
        EvenementInfo info = new EvenementInfo(evenementId, "Fete ouverte", ZonedDateTime.now(),
            "Stade", false, true, "TOUS", "OBLIGATOIRE", null);
        when(evenementQueryPort.trouverEvenementDetails(evenementId)).thenReturn(info);
        when(personneQueryPort.trouverContactsParRole("benevole")).thenReturn(List.of(b1));
        when(personneQueryPort.trouverContactsParRole("beneficiaire")).thenReturn(List.of(p1));

        service.notifierPublicationEvenement(evenementId);

        verify(emailService, times(2)).envoyerPublicationEvenement(anyString(), any(ContexteEvenementEmail.class));
    }

    @Test
    void notifierPublicationEvenement_benevoleEnStaffEtPublicBenevoles_envoieUnSeulEmail() {
        UUID evenementId = UUID.randomUUID();
        UUID b1Id = UUID.randomUUID();
        PersonneContactInfo b1 = new PersonneContactInfo(b1Id, "b1@ev.com", "Dup", "Lic");
        // aBesoiNStaff=true ET publicParticipants=BENEVOLES -> meme benevole potentiellement dans les deux listes
        EvenementInfo info = new EvenementInfo(evenementId, "Stand", ZonedDateTime.now(),
            null, true, true, "BENEVOLES", "OBLIGATOIRE", null);
        when(evenementQueryPort.trouverEvenementDetails(evenementId)).thenReturn(info);
        when(personneQueryPort.trouverContactsParRole("benevole")).thenReturn(List.of(b1));

        service.notifierPublicationEvenement(evenementId);

        // le set de deduplication garantit un seul envoi
        verify(emailService, times(1)).envoyerPublicationEvenement(eq("b1@ev.com"), any());
    }

    @Test
    void notifierPublicationEvenement_sansStaffSansParticipants_nEnvoiePas() {
        UUID evenementId = UUID.randomUUID();
        EvenementInfo info = new EvenementInfo(evenementId, "Info interne", ZonedDateTime.now(),
            null, false, false, null, "SANS_INSCRIPTION", null);
        when(evenementQueryPort.trouverEvenementDetails(evenementId)).thenReturn(info);

        service.notifierPublicationEvenement(evenementId);

        verify(emailService, never()).envoyerPublicationEvenement(anyString(), any());
    }

    // --- annulation evenement ---

    @Test
    void notifierAnnulationEvenement_modeObligatoire_notifieInscrits() {
        UUID evenementId = UUID.randomUUID();
        UUID inscritId = UUID.randomUUID();
        PersonneContactInfo inscrit = new PersonneContactInfo(inscritId, "ins@ev.com", "Leo", "Gris");
        EvenementInfo info = new EvenementInfo(evenementId, "Concert annule", ZonedDateTime.now(),
            "Salle A", false, false, null, "OBLIGATOIRE", "Manque de public");
        when(evenementQueryPort.trouverEvenementDetails(evenementId)).thenReturn(info);
        when(evenementQueryPort.trouverInscrits(evenementId)).thenReturn(List.of(inscritId));
        when(personneQueryPort.trouverPersonneParId(inscritId)).thenReturn(inscrit);

        service.notifierAnnulationEvenement(evenementId);

        verify(emailService).envoyerAnnulationEvenement(eq("ins@ev.com"), any(ContexteEvenementEmail.class));
        verify(traceur).tracer(any(Notification.class));
    }

    @Test
    void notifierAnnulationEvenement_modeLibre_notifieInscritsEtContactEmail() {
        UUID evenementId = UUID.randomUUID();
        UUID inscritId = UUID.randomUUID();
        PersonneContactInfo inscrit = new PersonneContactInfo(inscritId, "ins@ev.com", "Noa", "Rose");
        EvenementInfo info = new EvenementInfo(evenementId, "Fete annulee", ZonedDateTime.now(),
            "Parc B", false, false, null, "LIBRE", "Intemperies");
        when(evenementQueryPort.trouverEvenementDetails(evenementId)).thenReturn(info);
        when(evenementQueryPort.trouverInscrits(evenementId)).thenReturn(List.of(inscritId));
        when(personneQueryPort.trouverPersonneParId(inscritId)).thenReturn(inscrit);
        when(associationQueryPort.trouverContactEmail())
            .thenReturn(Optional.of("contact@asso.fr"));

        service.notifierAnnulationEvenement(evenementId);

        // inscrit + contactEmail
        verify(emailService, times(2)).envoyerAnnulationEvenement(anyString(), any(ContexteEvenementEmail.class));
    }

    @Test
    void notifierAnnulationEvenement_modeLibre_echecContactEmail_neLevesPasException() {
        UUID evenementId = UUID.randomUUID();
        EvenementInfo info = new EvenementInfo(evenementId, "Marche annule", ZonedDateTime.now(),
            null, false, false, null, "LIBRE", "Pluie");
        when(evenementQueryPort.trouverEvenementDetails(evenementId)).thenReturn(info);
        when(evenementQueryPort.trouverInscrits(evenementId)).thenReturn(List.of());
        when(associationQueryPort.trouverContactEmail())
            .thenReturn(Optional.of("contact@asso.fr"));
        doThrow(new NotificationEmailException(new RuntimeException("SMTP")))
            .when(emailService).envoyerAnnulationEvenement(eq("contact@asso.fr"), any());

        // ne doit pas lever d'exception
        service.notifierAnnulationEvenement(evenementId);
    }

    @Test
    void notifierAnnulationEvenement_modeLibre_sansContactEmail_notifieSeulementInscrits() {
        UUID evenementId = UUID.randomUUID();
        UUID inscritId = UUID.randomUUID();
        PersonneContactInfo inscrit = new PersonneContactInfo(inscritId, "i@ev.com", "Kim", "Blanc");
        EvenementInfo info = new EvenementInfo(evenementId, "Atelier", ZonedDateTime.now(),
            null, false, false, null, "LIBRE", "Annule");
        when(evenementQueryPort.trouverEvenementDetails(evenementId)).thenReturn(info);
        when(evenementQueryPort.trouverInscrits(evenementId)).thenReturn(List.of(inscritId));
        when(personneQueryPort.trouverPersonneParId(inscritId)).thenReturn(inscrit);
        when(associationQueryPort.trouverContactEmail()).thenReturn(Optional.empty());

        service.notifierAnnulationEvenement(evenementId);

        verify(emailService, times(1)).envoyerAnnulationEvenement(eq("i@ev.com"), any());
    }

    @Test
    void notifierAnnulationEvenement_modeSansInscription_notifieBenevolesBeneficiaires() {
        UUID evenementId = UUID.randomUUID();
        UUID bId = UUID.randomUUID();
        UUID pId = UUID.randomUUID();
        PersonneContactInfo bev = new PersonneContactInfo(bId, "bev@ev.com", "Alex", "Nord");
        PersonneContactInfo ben = new PersonneContactInfo(pId, "ben@ev.com", "Sam", "Sud");
        EvenementInfo info = new EvenementInfo(evenementId, "Stand ouvert annule", ZonedDateTime.now(),
            "Esplanade", false, false, null, "SANS_INSCRIPTION", "Securite");
        when(evenementQueryPort.trouverEvenementDetails(evenementId)).thenReturn(info);
        when(personneQueryPort.trouverContactsParRole("benevole")).thenReturn(List.of(bev));
        when(personneQueryPort.trouverContactsParRole("beneficiaire")).thenReturn(List.of(ben));

        service.notifierAnnulationEvenement(evenementId);

        verify(emailService).envoyerAnnulationEvenement(eq("bev@ev.com"), any(ContexteEvenementEmail.class));
        verify(emailService).envoyerAnnulationEvenement(eq("ben@ev.com"), any(ContexteEvenementEmail.class));
        verify(traceur, times(2)).tracer(any(Notification.class));
    }

    @Test
    void notifierAnnulationEvenement_modeSansInscription_deduplicateBenevolesBeneficiaires() {
        UUID evenementId = UUID.randomUUID();
        UUID communId = UUID.randomUUID();
        PersonneContactInfo commun = new PersonneContactInfo(communId, "x@ev.com", "Uni", "Que");
        EvenementInfo info = new EvenementInfo(evenementId, "Stand deduplique", ZonedDateTime.now(),
            null, false, false, null, "SANS_INSCRIPTION", "Annule");
        when(evenementQueryPort.trouverEvenementDetails(evenementId)).thenReturn(info);
        when(personneQueryPort.trouverContactsParRole("benevole")).thenReturn(List.of(commun));
        when(personneQueryPort.trouverContactsParRole("beneficiaire")).thenReturn(List.of(commun));

        service.notifierAnnulationEvenement(evenementId);

        // meme id dans benevoles et beneficiaires -> un seul email
        verify(emailService, times(1)).envoyerAnnulationEvenement(eq("x@ev.com"), any());
    }

    // --- idempotence et relance (ADR-003) ---

    @Test
    void notifierConfirmationInscription_cleDejaEnvoyee_nEnvoieRien() {
        UUID occurrenceId = UUID.randomUUID();
        when(personneQueryPort.trouverPersonneParId(personneId)).thenReturn(personne);
        when(distributionQueryPort.trouverDistributionDetails(distributionId)).thenReturn(distribution);
        when(traceur.dejaEnvoyee("CONFIRMATION_INSCRIPTION:" + occurrenceId, personneId)).thenReturn(true);

        service.notifierConfirmationInscription(personneId, distributionId, "BENEFICIAIRE", null, occurrenceId);

        verify(emailService, never()).envoyerConfirmationInscription(anyString(), any());
        verify(traceur, never()).tracer(any());
    }

    @Test
    void notifierConfirmationInscription_publicationAnterieureSansOccurrence_envoieSansCle() {
        when(personneQueryPort.trouverPersonneParId(personneId)).thenReturn(personne);
        when(distributionQueryPort.trouverDistributionDetails(distributionId)).thenReturn(distribution);

        service.notifierConfirmationInscription(personneId, distributionId, "BENEFICIAIRE", null, null);

        verify(traceur).dejaEnvoyee(null, personneId);
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(traceur).tracer(captor.capture());
        assertThat(captor.getValue().getCleIdempotence()).isNull();
    }

    @Test
    void notifierRappelVeille_unEchecSurTrois_traceTousEtLeveException() {
        DestinataireMail a = new DestinataireMail(UUID.randomUUID(), "a@ex.com", "A", "BENEFICIAIRE", null);
        DestinataireMail b = new DestinataireMail(UUID.randomUUID(), "b@ex.com", "B", "BENEFICIAIRE", null);
        DestinataireMail c = new DestinataireMail(UUID.randomUUID(), "c@ex.com", "C", "BENEVOLE", null);
        when(distributionQueryPort.trouverDistributionDetails(distributionId)).thenReturn(distribution);
        when(inscriptionQueryPort.trouverInscritsConfirmes(distributionId)).thenReturn(List.of(a, b, c));
        lenient().doThrow(new NotificationEmailException(new RuntimeException("SMTP KO")))
            .when(emailService).envoyerRappelVeille(eq("b@ex.com"), any());

        assertThatThrownBy(() -> service.notifierRappelVeille(distributionId))
            .isInstanceOf(NotificationsIncompletesException.class)
            .hasMessageContaining("1 notification(s) RAPPEL_VEILLE");

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(traceur, times(3)).tracer(captor.capture());
        assertThat(captor.getAllValues()).extracting(Notification::getStatut)
            .containsExactly(StatutNotification.ENVOYE, StatutNotification.ECHEC, StatutNotification.ENVOYE);
        assertThat(captor.getAllValues()).extracting(Notification::getCleIdempotence)
            .containsOnly("RAPPEL_VEILLE:" + distributionId);
    }

    @Test
    void notifierRappelVeille_relance_neRenvoieQuAuDestinataireEnEchec() {
        DestinataireMail servi = new DestinataireMail(UUID.randomUUID(), "a@ex.com", "A", "BENEFICIAIRE", null);
        DestinataireMail enEchec = new DestinataireMail(UUID.randomUUID(), "b@ex.com", "B", "BENEFICIAIRE", null);
        String cle = "RAPPEL_VEILLE:" + distributionId;
        when(distributionQueryPort.trouverDistributionDetails(distributionId)).thenReturn(distribution);
        when(inscriptionQueryPort.trouverInscritsConfirmes(distributionId)).thenReturn(List.of(servi, enEchec));
        when(traceur.dejaEnvoyee(cle, servi.personneId())).thenReturn(true);

        service.notifierRappelVeille(distributionId);

        verify(emailService, never()).envoyerRappelVeille(eq("a@ex.com"), any());
        verify(emailService).envoyerRappelVeille(eq("b@ex.com"), any());
    }

    @Test
    void notifierAnnulationEvenement_echecDUnInscrit_leveException() {
        UUID evenementId = UUID.randomUUID();
        UUID inscritId = UUID.randomUUID();
        EvenementInfo info = new EvenementInfo(evenementId, "Atelier", ZonedDateTime.now(),
            null, false, false, null, "OBLIGATOIRE", "Annule");
        when(evenementQueryPort.trouverEvenementDetails(evenementId)).thenReturn(info);
        when(evenementQueryPort.trouverInscrits(evenementId)).thenReturn(List.of(inscritId));
        when(personneQueryPort.trouverPersonneParId(inscritId))
            .thenReturn(new PersonneContactInfo(inscritId, "i@ev.com", "Kim", "Blanc"));
        doThrow(new NotificationEmailException(new RuntimeException("SMTP")))
            .when(emailService).envoyerAnnulationEvenement(eq("i@ev.com"), any());

        assertThatThrownBy(() -> service.notifierAnnulationEvenement(evenementId))
            .isInstanceOf(NotificationsIncompletesException.class);
    }
}
