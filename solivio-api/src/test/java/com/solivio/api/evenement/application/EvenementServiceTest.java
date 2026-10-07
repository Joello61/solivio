package com.solivio.api.evenement.application;

import com.solivio.api.evenement.domain.Evenement;
import com.solivio.api.evenement.domain.ModeInscription;
import com.solivio.api.evenement.domain.PublicCible;
import com.solivio.api.evenement.domain.StatutEvenement;
import com.solivio.api.evenement.domain.TypeEvenement;
import com.solivio.api.evenement.infrastructure.evenements.EvenementEventPublisher;
import com.solivio.api.evenement.infrastructure.persistence.EvenementRepository;
import com.solivio.api.evenement.infrastructure.persistence.ParticipationEvenementRepository;
import com.solivio.api.evenement.infrastructure.web.dto.CreateEvenementRequest;
import com.solivio.api.evenement.infrastructure.web.dto.EvenementResponse;
import com.solivio.api.shared.exception.ConflictException;
import com.solivio.api.shared.exception.NotFoundException;
import com.solivio.api.shared.identity.PersonneQueryPort;
import com.solivio.api.shared.identity.PersonneQueryPort.PersonneInfo;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EvenementServiceTest {

    @Mock private EvenementRepository evenementRepository;
    @Mock private ParticipationEvenementRepository participationRepository;
    @Mock private EvenementEventPublisher eventPublisher;
    @Mock private PersonneQueryPort personneQueryPort;

    private EvenementService service;
    private UUID evenementId;
    private UUID creeParId;
    private Evenement evenement;

    @BeforeEach
    void setUp() {
        service = new EvenementService(
            evenementRepository, participationRepository, eventPublisher, personneQueryPort);
        evenementId = UUID.randomUUID();
        creeParId = UUID.randomUUID();
        evenement = new Evenement(
            "Fete de printemps", null, TypeEvenement.FETE,
            null, "Place de la Republique", null, null,
            ZonedDateTime.now().plusDays(7),
            ZonedDateTime.now().plusDays(7).plusHours(4),
            true, true, PublicCible.TOUS, ModeInscription.OBLIGATOIRE,
            10, 50, creeParId
        );
        evenement.setId(evenementId);
    }

    @Test
    void creer_sauvegardeLEvenementAvecStatutBrouillon() {
        when(participationRepository.countByEvenementIdAndRole(any(), any())).thenReturn(0L);
        when(personneQueryPort.trouverPersonne("admin@test.com"))
            .thenReturn(new PersonneInfo(creeParId, "Admin", "Test"));
        when(evenementRepository.save(any(Evenement.class))).thenAnswer(inv -> {
            Evenement e = inv.getArgument(0);
            e.setId(evenementId);
            return e;
        });

        CreateEvenementRequest request = new CreateEvenementRequest(
            "Fete de printemps", null, "FETE",
            null, "Place de la Republique", null, null,
            ZonedDateTime.now().plusDays(7),
            ZonedDateTime.now().plusDays(7).plusHours(4),
            true, true, "TOUS", "OBLIGATOIRE", 10, 50
        );
        EvenementResponse response = service.creer(request, "admin@test.com");

        assertThat(response.statut()).isEqualTo("BROUILLON");
        assertThat(response.titre()).isEqualTo("Fete de printemps");
        assertThat(response.type()).isEqualTo("FETE");
        verify(evenementRepository).save(any(Evenement.class));
    }

    @Test
    void creer_echoueSiDateFinAvantDebut() {
        ZonedDateTime debut = ZonedDateTime.now().plusDays(7);
        CreateEvenementRequest request = new CreateEvenementRequest(
            "Evenement invalide", null, null,
            null, null, null, null,
            debut, debut.minusHours(1),
            true, false, null, null, null, null
        );
        assertThatThrownBy(() -> service.creer(request, "admin@test.com"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("date_heure_fin");
    }

    @Test
    void publier_transitionneVersPUBLIEEtEmetEvenement() {
        when(evenementRepository.findById(evenementId)).thenReturn(Optional.of(evenement));
        when(evenementRepository.save(any())).thenReturn(evenement);

        EvenementResponse response = service.publier(evenementId);

        assertThat(response.statut()).isEqualTo("PUBLIE");
        verify(eventPublisher).publierPublie(evenementId, evenement.getDateHeureDebut());
    }

    @Test
    void publier_echoueSiDejaPublie() {
        evenement.transitionnerVers(StatutEvenement.PUBLIE, null);
        when(evenementRepository.findById(evenementId)).thenReturn(Optional.of(evenement));

        assertThatThrownBy(() -> service.publier(evenementId))
            .isInstanceOf(ConflictException.class);
    }

    @Test
    void annuler_transitionneVersANNULEAvecRaison() {
        evenement.transitionnerVers(StatutEvenement.PUBLIE, null);
        when(evenementRepository.findById(evenementId)).thenReturn(Optional.of(evenement));
        when(evenementRepository.save(any())).thenReturn(evenement);

        var request = new com.solivio.api.evenement.infrastructure.web.dto.AnnulerEvenementRequest(
            "Manque de benevoles");
        EvenementResponse response = service.annuler(evenementId, request);

        assertThat(response.statut()).isEqualTo("ANNULE");
        assertThat(response.raisonAnnulation()).isEqualTo("Manque de benevoles");
        verify(eventPublisher).publierAnnule(evenementId, evenement.getDateHeureDebut());
    }

    @Test
    void annuler_echoueSiStatutTermine() {
        evenement.transitionnerVers(StatutEvenement.PUBLIE, null);
        evenement.transitionnerVers(StatutEvenement.EN_COURS, null);
        evenement.transitionnerVers(StatutEvenement.TERMINE, null);
        when(evenementRepository.findById(evenementId)).thenReturn(Optional.of(evenement));

        var request = new com.solivio.api.evenement.infrastructure.web.dto.AnnulerEvenementRequest("raison");
        assertThatThrownBy(() -> service.annuler(evenementId, request))
            .isInstanceOf(ConflictException.class);
    }

    @Test
    void statutMachine_transitionsValides() {
        assertThat(StatutEvenement.BROUILLON.peutTransitionnerVers(StatutEvenement.PUBLIE)).isTrue();
        assertThat(StatutEvenement.BROUILLON.peutTransitionnerVers(StatutEvenement.ANNULE)).isTrue();
        assertThat(StatutEvenement.PUBLIE.peutTransitionnerVers(StatutEvenement.EN_COURS)).isTrue();
        assertThat(StatutEvenement.PUBLIE.peutTransitionnerVers(StatutEvenement.ANNULE)).isTrue();
        assertThat(StatutEvenement.EN_COURS.peutTransitionnerVers(StatutEvenement.TERMINE)).isTrue();
        assertThat(StatutEvenement.EN_COURS.peutTransitionnerVers(StatutEvenement.ANNULE)).isTrue();
        assertThat(StatutEvenement.TERMINE.peutTransitionnerVers(StatutEvenement.ANNULE)).isFalse();
        assertThat(StatutEvenement.ANNULE.peutTransitionnerVers(StatutEvenement.PUBLIE)).isFalse();
        assertThat(StatutEvenement.BROUILLON.peutTransitionnerVers(StatutEvenement.EN_COURS)).isFalse();
    }

    @Test
    void detail_retourneLEvenement() {
        when(evenementRepository.findById(evenementId)).thenReturn(Optional.of(evenement));

        EvenementResponse response = service.detail(evenementId);

        assertThat(response.id()).isEqualTo(evenementId);
        assertThat(response.modeInscription()).isEqualTo("OBLIGATOIRE");
        assertThat(response.publicParticipants()).isEqualTo("TOUS");
    }

    @Test
    void detail_echoueSiInexistant() {
        when(evenementRepository.findById(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.detail(UUID.randomUUID()))
            .isInstanceOf(NotFoundException.class);
    }

    @Test
    void lister_avecFiltreStatutEtType() {
        when(evenementRepository.findByStatutAndTypeOrderByDateHeureDebutAsc(
            StatutEvenement.PUBLIE, TypeEvenement.FETE))
            .thenReturn(List.of(evenement));
        evenement.transitionnerVers(StatutEvenement.PUBLIE, null);

        List<EvenementResponse> liste = service.lister("PUBLIE", "FETE");

        assertThat(liste).hasSize(1);
    }
}