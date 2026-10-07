package com.solivio.api.reconditionnement.application;

import com.solivio.api.reconditionnement.domain.InscriptionReconditionnement;
import com.solivio.api.reconditionnement.domain.SessionReconditionnement;
import com.solivio.api.reconditionnement.domain.StatutSessionReconditionnement;
import com.solivio.api.reconditionnement.infrastructure.evenements.ReconditionnementEventPublisher;
import com.solivio.api.reconditionnement.infrastructure.persistence.InscriptionReconditionnementRepository;
import com.solivio.api.reconditionnement.infrastructure.persistence.SessionReconditionnementRepository;
import com.solivio.api.reconditionnement.infrastructure.web.dto.AnnulerSessionRequest;
import com.solivio.api.reconditionnement.infrastructure.web.dto.CreateSessionReconditionnementRequest;
import com.solivio.api.reconditionnement.infrastructure.web.dto.InscriptionReconditionnementResponse;
import com.solivio.api.reconditionnement.infrastructure.web.dto.PointageReconditionnementRequest;
import com.solivio.api.reconditionnement.infrastructure.web.dto.SessionReconditionnementResponse;
import com.solivio.api.shared.exception.ConflictException;
import com.solivio.api.shared.exception.NotFoundException;
import com.solivio.api.shared.identity.PersonneQueryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SessionReconditionnementServiceTest {

    @Mock private SessionReconditionnementRepository sessionRepository;
    @Mock private InscriptionReconditionnementRepository inscriptionRepository;
    @Mock private ReconditionnementEventPublisher eventPublisher;
    @Mock private PersonneQueryPort personneQueryPort;

    private SessionReconditionnementService service;
    private UUID sessionId;
    private UUID creeParId;
    private SessionReconditionnement session;

    @BeforeEach
    void setUp() {
        service = new SessionReconditionnementService(
            sessionRepository, inscriptionRepository, eventPublisher, personneQueryPort
        );
        sessionId = UUID.randomUUID();
        creeParId = UUID.randomUUID();
        session = new SessionReconditionnement(
            "Session test", null, null,
            ZonedDateTime.now().plusDays(7),
            ZonedDateTime.now().plusDays(7).plusHours(2),
            20, creeParId
        );
        session.setId(sessionId);
    }

    @Test
    void creer_sauvegardeLaSession() {
        when(personneQueryPort.trouverPersonne("resp@example.com"))
            .thenReturn(new PersonneQueryPort.PersonneInfo(creeParId, "Dupont", "Marie"));
        when(sessionRepository.save(any(SessionReconditionnement.class))).thenAnswer(inv -> {
            SessionReconditionnement s = inv.getArgument(0);
            s.setId(sessionId);
            return s;
        });

        ZonedDateTime debut = ZonedDateTime.now().plusDays(3);
        ZonedDateTime fin = debut.plusHours(3);
        CreateSessionReconditionnementRequest request = new CreateSessionReconditionnementRequest(
            "Session test", null, null, debut, fin, 20
        );
        SessionReconditionnementResponse response = service.creer(request, "resp@example.com");

        assertThat(response.titre()).isEqualTo("Session test");
        assertThat(response.statut()).isEqualTo("BROUILLON");
        verify(sessionRepository).save(any(SessionReconditionnement.class));
    }

    @Test
    void creer_echoueSiDateFinAvantDebut() {
        ZonedDateTime debut = ZonedDateTime.now().plusDays(3);
        ZonedDateTime fin = debut.minusHours(1);
        CreateSessionReconditionnementRequest request = new CreateSessionReconditionnementRequest(
            "Session test", null, null, debut, fin, 20
        );
        assertThatThrownBy(() -> service.creer(request, "resp@example.com"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("date_heure_fin");
    }

    @Test
    void publier_transitionneDeBrouillonVersPubliee() {
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(sessionRepository.save(any(SessionReconditionnement.class))).thenReturn(session);
        when(inscriptionRepository.countBySessionIdAndStatut(sessionId, "CONFIRMEE")).thenReturn(0L);

        SessionReconditionnementResponse response = service.publier(sessionId);

        assertThat(response.statut()).isEqualTo("PUBLIEE");
        verifyNoInteractions(eventPublisher);
    }

    @Test
    void publier_echoueSiSessionInexistante() {
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.publier(sessionId))
            .isInstanceOf(NotFoundException.class);
    }

    @Test
    void annuler_emettreEvenementEtStockerMotif() {
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(sessionRepository.save(any(SessionReconditionnement.class))).thenReturn(session);
        when(inscriptionRepository.countBySessionIdAndStatut(sessionId, "CONFIRMEE")).thenReturn(0L);

        SessionReconditionnementResponse response = service.annuler(
            sessionId, new AnnulerSessionRequest("Manque de benevoles")
        );

        assertThat(response.statut()).isEqualTo("ANNULEE");
        assertThat(response.motifAnnulation()).isEqualTo("Manque de benevoles");
        verify(eventPublisher).publierAnnulee(eq(sessionId), any(ZonedDateTime.class));
    }

    @Test
    void inscrire_echoueSiSessionNonPubliee() {
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        // session en BROUILLON, exception levee avant d'appeler personneQueryPort
        assertThatThrownBy(() -> service.inscrire(sessionId, "benevole@example.com"))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("publiee");
    }

    @Test
    void inscrire_echoueSiCapaciteAtteinte() {
        session.transitionnerVers(StatutSessionReconditionnement.PUBLIEE, null);
        session.setCapacite(2);
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(inscriptionRepository.countBySessionIdAndStatut(sessionId, "CONFIRMEE")).thenReturn(2L);

        assertThatThrownBy(() -> service.inscrire(sessionId, "benevole@example.com"))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("capacite");
    }

    @Test
    void inscrire_succes() {
        session.transitionnerVers(StatutSessionReconditionnement.PUBLIEE, null);
        UUID personneId = UUID.randomUUID();
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(inscriptionRepository.countBySessionIdAndStatut(sessionId, "CONFIRMEE")).thenReturn(1L);
        when(personneQueryPort.trouverPersonne("benevole@example.com"))
            .thenReturn(new PersonneQueryPort.PersonneInfo(personneId, "Martin", "Paul"));
        when(inscriptionRepository.findBySessionIdAndPersonneId(sessionId, personneId))
            .thenReturn(Optional.empty());
        when(inscriptionRepository.save(any(InscriptionReconditionnement.class))).thenAnswer(inv -> {
            InscriptionReconditionnement i = inv.getArgument(0);
            i.setId(UUID.randomUUID());
            return i;
        });

        InscriptionReconditionnementResponse response = service.inscrire(sessionId, "benevole@example.com");

        assertThat(response.statut()).isEqualTo("CONFIRMEE");
        verify(inscriptionRepository).save(any(InscriptionReconditionnement.class));
    }

    @Test
    void desinscrire_echoueSiSessionEnCours() {
        session.transitionnerVers(StatutSessionReconditionnement.PUBLIEE, null);
        session.transitionnerVers(StatutSessionReconditionnement.EN_COURS, null);
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> service.desinscrire(sessionId, "benevole@example.com"))
            .isInstanceOf(ConflictException.class);
    }

    @Test
    void pointer_misAJourLaPresence() {
        session.transitionnerVers(StatutSessionReconditionnement.PUBLIEE, null);
        session.transitionnerVers(StatutSessionReconditionnement.EN_COURS, null);
        UUID personneId = UUID.randomUUID();
        InscriptionReconditionnement inscription = new InscriptionReconditionnement(sessionId, personneId);
        inscription.setId(UUID.randomUUID());

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(inscriptionRepository.findBySessionIdAndPersonneId(sessionId, personneId))
            .thenReturn(Optional.of(inscription));
        when(inscriptionRepository.save(any(InscriptionReconditionnement.class))).thenReturn(inscription);
        when(personneQueryPort.trouverPersonneParId(personneId))
            .thenReturn(new PersonneQueryPort.PersonneContactInfo(personneId, "p@p.com", "Paul", "Martin"));

        InscriptionReconditionnementResponse response = service.pointer(
            sessionId, new PointageReconditionnementRequest(personneId, "PRESENT")
        );

        assertThat(response.presence()).isEqualTo("PRESENT");
    }

    @Test
    void cycleDeVie_brouillonPublieeEnCoursTerminee() {
        session.transitionnerVers(StatutSessionReconditionnement.PUBLIEE, null);
        assertThat(session.getStatut()).isEqualTo(StatutSessionReconditionnement.PUBLIEE);

        session.transitionnerVers(StatutSessionReconditionnement.EN_COURS, null);
        assertThat(session.getStatut()).isEqualTo(StatutSessionReconditionnement.EN_COURS);

        session.transitionnerVers(StatutSessionReconditionnement.TERMINEE, null);
        assertThat(session.getStatut()).isEqualTo(StatutSessionReconditionnement.TERMINEE);
    }

    @Test
    void transition_interdite_brouillonVersTerminee() {
        assertThatThrownBy(() -> session.transitionnerVers(StatutSessionReconditionnement.TERMINEE, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Transition interdite");
    }

    @Test
    void listerInscrits_retourneLesInscritsDeLaSession() {
        UUID personneId = UUID.randomUUID();
        InscriptionReconditionnement inscription = new InscriptionReconditionnement(sessionId, personneId);
        inscription.setId(UUID.randomUUID());

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(inscriptionRepository.findBySessionId(sessionId)).thenReturn(List.of(inscription));
        when(personneQueryPort.trouverPersonneParId(personneId))
            .thenReturn(new PersonneQueryPort.PersonneContactInfo(
                personneId, "p@p.com", "Paul", "Martin"));

        List<InscriptionReconditionnementResponse> inscrits = service.listerInscrits(sessionId);

        assertThat(inscrits).hasSize(1);
        assertThat(inscrits.get(0).personneId()).isEqualTo(personneId);
    }
}
