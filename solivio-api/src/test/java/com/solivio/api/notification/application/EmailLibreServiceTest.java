package com.solivio.api.notification.application;

import com.solivio.api.notification.domain.CibleEmail;
import com.solivio.api.notification.domain.Notification;
import com.solivio.api.notification.domain.StatutNotification;
import com.solivio.api.notification.domain.TypeEvenementNotification;
import com.solivio.api.notification.infrastructure.email.NotificationEmailException;
import com.solivio.api.notification.infrastructure.persistence.NotificationRepository;
import com.solivio.api.shared.identity.PersonneQueryPort;
import com.solivio.api.shared.identity.PersonneQueryPort.PersonneContactInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
class EmailLibreServiceTest {

    @Mock private NotificationEmailService emailService;
    @Mock private PersonneQueryPort personneQueryPort;
    @Mock private NotificationRepository notificationRepository;

    private EmailLibreService service;

    @BeforeEach
    void setUp() {
        service = new EmailLibreService(emailService, personneQueryPort, notificationRepository);
    }

    @Test
    void envoyer_benevoles_envoieATousLesBenevoles() {
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        PersonneContactInfo b1 = new PersonneContactInfo(id1, "b1@ex.com", "Alice", "A");
        PersonneContactInfo b2 = new PersonneContactInfo(id2, "b2@ex.com", "Bob", "B");
        when(personneQueryPort.trouverContactsParRole("benevole")).thenReturn(List.of(b1, b2));

        service.envoyer(CibleEmail.BENEVOLES, "Reunion", "Corps du message");

        verify(emailService).envoyerEmailLibre("b1@ex.com", "Reunion", "Corps du message");
        verify(emailService).envoyerEmailLibre("b2@ex.com", "Reunion", "Corps du message");
        verify(notificationRepository, times(2)).save(any(Notification.class));
    }

    @Test
    void envoyer_beneficiaires_envoieAuxBeneficiaires() {
        UUID id = UUID.randomUUID();
        PersonneContactInfo p = new PersonneContactInfo(id, "p@ex.com", "Clara", "C");
        when(personneQueryPort.trouverContactsParRole("beneficiaire")).thenReturn(List.of(p));

        service.envoyer(CibleEmail.BENEFICIAIRES, "Info", "Corps");

        verify(emailService).envoyerEmailLibre("p@ex.com", "Info", "Corps");
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertThat(captor.getValue().getTypeEvenement()).isEqualTo(TypeEvenementNotification.EMAIL_LIBRE);
        assertThat(captor.getValue().getStatut()).isEqualTo(StatutNotification.ENVOYE);
    }

    @Test
    void envoyer_coordinateurs_envoieAuxCoordinateurs() {
        UUID id = UUID.randomUUID();
        PersonneContactInfo c = new PersonneContactInfo(id, "coord@ex.com", "Dana", "D");
        when(personneQueryPort.trouverContactsParRole("coordinateur")).thenReturn(List.of(c));

        service.envoyer(CibleEmail.COORDINATEURS, "Reunion coord", "Details");

        verify(emailService).envoyerEmailLibre("coord@ex.com", "Reunion coord", "Details");
    }

    @Test
    void envoyer_responsables_envoieAuxResponsables() {
        UUID id = UUID.randomUUID();
        PersonneContactInfo r = new PersonneContactInfo(id, "resp@ex.com", "Eric", "E");
        when(personneQueryPort.trouverContactsParRole("responsable")).thenReturn(List.of(r));

        service.envoyer(CibleEmail.RESPONSABLES, "Note direction", "Contenu");

        verify(emailService).envoyerEmailLibre("resp@ex.com", "Note direction", "Contenu");
    }

    @Test
    void envoyer_tous_envoieATousLesRoles() {
        UUID b1Id = UUID.randomUUID();
        UUID p1Id = UUID.randomUUID();
        UUID c1Id = UUID.randomUUID();
        UUID r1Id = UUID.randomUUID();
        PersonneContactInfo b1 = new PersonneContactInfo(b1Id, "bev@ex.com", "Bev", "X");
        PersonneContactInfo p1 = new PersonneContactInfo(p1Id, "ben@ex.com", "Ben", "Y");
        PersonneContactInfo c1 = new PersonneContactInfo(c1Id, "coo@ex.com", "Coo", "Z");
        PersonneContactInfo r1 = new PersonneContactInfo(r1Id, "res@ex.com", "Res", "W");
        when(personneQueryPort.trouverContactsParRole("benevole")).thenReturn(List.of(b1));
        when(personneQueryPort.trouverContactsParRole("beneficiaire")).thenReturn(List.of(p1));
        when(personneQueryPort.trouverContactsParRole("coordinateur")).thenReturn(List.of(c1));
        when(personneQueryPort.trouverContactsParRole("responsable")).thenReturn(List.of(r1));

        service.envoyer(CibleEmail.TOUS, "Message general", "Bonjour a tous");

        verify(emailService, times(4)).envoyerEmailLibre(anyString(), anyString(), anyString());
        verify(notificationRepository, times(4)).save(any(Notification.class));
    }

    @Test
    void envoyer_tous_deduplicateLesMembresPresentsEnPlusieursRoles() {
        UUID communId = UUID.randomUUID();
        PersonneContactInfo commun = new PersonneContactInfo(communId, "multi@ex.com", "Multi", "Role");
        when(personneQueryPort.trouverContactsParRole("benevole")).thenReturn(List.of(commun));
        when(personneQueryPort.trouverContactsParRole("beneficiaire")).thenReturn(List.of(commun));
        when(personneQueryPort.trouverContactsParRole("coordinateur")).thenReturn(List.of());
        when(personneQueryPort.trouverContactsParRole("responsable")).thenReturn(List.of());

        service.envoyer(CibleEmail.TOUS, "Sujet", "Corps");

        // la personne apparait dans benevoles ET beneficiaires mais ne recoit qu'un seul email
        verify(emailService, times(1)).envoyerEmailLibre(eq("multi@ex.com"), anyString(), anyString());
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    void envoyer_echecEnvoi_traceEchec() {
        UUID id = UUID.randomUUID();
        PersonneContactInfo p = new PersonneContactInfo(id, "fail@ex.com", "Fail", "F");
        when(personneQueryPort.trouverContactsParRole("benevole")).thenReturn(List.of(p));
        doThrow(new NotificationEmailException("fail@ex.com", "sujet", new RuntimeException("SMTP KO")))
            .when(emailService).envoyerEmailLibre(anyString(), anyString(), anyString());

        service.envoyer(CibleEmail.BENEVOLES, "sujet", "corps");

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertThat(captor.getValue().getStatut()).isEqualTo(StatutNotification.ECHEC);
        assertThat(captor.getValue().getErreur()).isNotBlank();
    }

    @Test
    void envoyer_listeVide_nEnvoiePasDemail() {
        when(personneQueryPort.trouverContactsParRole("coordinateur")).thenReturn(List.of());

        service.envoyer(CibleEmail.COORDINATEURS, "Sujet", "Corps");

        verify(emailService, never()).envoyerEmailLibre(anyString(), anyString(), anyString());
        verify(notificationRepository, never()).save(any());
    }
}
