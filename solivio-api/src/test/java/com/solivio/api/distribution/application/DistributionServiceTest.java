package com.solivio.api.distribution.application;

import com.solivio.api.distribution.domain.Distribution;
import com.solivio.api.distribution.domain.ModeCreneauDistribution;
import com.solivio.api.distribution.domain.StatutDistribution;
import com.solivio.api.distribution.infrastructure.kafka.DistributionEventPublisher;
import com.solivio.api.distribution.infrastructure.persistence.CreneauRepository;
import com.solivio.api.distribution.infrastructure.persistence.DistributionRepository;
import com.solivio.api.distribution.infrastructure.web.dto.AjouterCreneauRequest;
import com.solivio.api.distribution.infrastructure.web.dto.CreateDistributionRequest;
import com.solivio.api.distribution.infrastructure.web.dto.DistributionResponse;
import com.solivio.api.shared.exception.NotFoundException;
import com.solivio.api.shared.identity.PersonneQueryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DistributionServiceTest {

    @Mock private DistributionRepository distributionRepository;
    @Mock private CreneauRepository creneauRepository;
    @Mock private DistributionEventPublisher eventPublisher;
    @Mock private PersonneQueryPort personneQueryPort;

    private DistributionService service;
    private UUID distributionId;
    private UUID creeParId;
    private Distribution distribution;

    @BeforeEach
    void setUp() {
        service = new DistributionService(
            distributionRepository, creneauRepository, eventPublisher, personneQueryPort
        );
        distributionId = UUID.randomUUID();
        creeParId = UUID.randomUUID();
        distribution = new Distribution(
            "Distribution de test", null, "Salle A", LocalDate.now().plusDays(7),
            50, 10, ModeCreneauDistribution.CRENEAU_UNIQUE, creeParId
        );
        distribution.setId(distributionId);
    }

    @Test
    void creer_sauvegardeLaDistributionEtLesCreneaux() {
        PersonneQueryPort.PersonneInfo createur =
            new PersonneQueryPort.PersonneInfo(creeParId, "Martin", "Alice");
        when(personneQueryPort.trouverPersonne("alice@example.com")).thenReturn(createur);
        when(distributionRepository.save(any(Distribution.class))).thenAnswer(inv -> {
            Distribution d = inv.getArgument(0);
            d.setId(distributionId);
            return d;
        });
        when(creneauRepository.save(any(com.solivio.api.distribution.domain.Creneau.class)))
            .thenAnswer(inv -> {
                com.solivio.api.distribution.domain.Creneau c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                return c;
            });

        CreateDistributionRequest request = new CreateDistributionRequest(
            "Distribution de test", null, "Salle A", LocalDate.now().plusDays(7),
            50, 10, "CRENEAU_UNIQUE",
            List.of(new AjouterCreneauRequest(LocalTime.of(10, 0), LocalTime.of(12, 0), 50))
        );
        DistributionResponse response = service.creer(request, "alice@example.com");

        assertThat(response.titre()).isEqualTo("Distribution de test");
        assertThat(response.statut()).isEqualTo("BROUILLON");
        verify(distributionRepository).save(any(Distribution.class));
    }

    @Test
    void creer_echoueSiAucunCreneau() {
        CreateDistributionRequest request = new CreateDistributionRequest(
            "Test", null, null, LocalDate.now().plusDays(1), 10, null, null, List.of()
        );
        assertThatThrownBy(() -> service.creer(request, "user@example.com"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("creneau");
    }

    @Test
    void creer_echoueSiHeureFinAvantDebut() {
        CreateDistributionRequest request = new CreateDistributionRequest(
            "Test", null, null, LocalDate.now().plusDays(1), 10, null, null,
            List.of(new AjouterCreneauRequest(LocalTime.of(12, 0), LocalTime.of(10, 0), 10))
        );
        assertThatThrownBy(() -> service.creer(request, "user@example.com"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("heure_fin");
    }

    @Test
    void publier_transitionneDeBrouillonVersPubliee() {
        when(distributionRepository.findById(distributionId)).thenReturn(Optional.of(distribution));
        when(distributionRepository.save(any(Distribution.class))).thenReturn(distribution);
        when(creneauRepository.findByDistributionIdOrderByHeureDebut(distributionId))
            .thenReturn(List.of());

        DistributionResponse response = service.publier(distributionId, "tenant1");

        assertThat(response.statut()).isEqualTo("PUBLIEE");
        verify(eventPublisher).publierPubliee(distributionId, "tenant1");
    }

    @Test
    void publier_echoueSiDistributionInexistante() {
        when(distributionRepository.findById(distributionId)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.publier(distributionId, "tenant1"))
            .isInstanceOf(NotFoundException.class);
    }

    @Test
    void annuler_emettreEvenementEtStockerMotif() {
        when(distributionRepository.findById(distributionId)).thenReturn(Optional.of(distribution));
        when(distributionRepository.save(any(Distribution.class))).thenReturn(distribution);
        when(creneauRepository.findByDistributionIdOrderByHeureDebut(distributionId))
            .thenReturn(List.of());

        DistributionResponse response = service.annuler(distributionId, "Raison X", "tenant1");

        assertThat(response.statut()).isEqualTo("ANNULEE");
        assertThat(response.motifAnnulation()).isEqualTo("Raison X");
        verify(eventPublisher).publierAnnulee(distributionId, "tenant1");
    }

    @Test
    void transitionnerVers_echoueSiTransitionInterdite() {
        assertThatThrownBy(() -> distribution.transitionnerVers(StatutDistribution.TERMINEE, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Transition interdite");
    }

    @Test
    void cycleDeVieComplet_brouillonPublieeEnCoursTerminee() {
        distribution.transitionnerVers(StatutDistribution.PUBLIEE, null);
        assertThat(distribution.getStatut()).isEqualTo(StatutDistribution.PUBLIEE);

        distribution.transitionnerVers(StatutDistribution.EN_COURS, null);
        assertThat(distribution.getStatut()).isEqualTo(StatutDistribution.EN_COURS);

        distribution.transitionnerVers(StatutDistribution.TERMINEE, null);
        assertThat(distribution.getStatut()).isEqualTo(StatutDistribution.TERMINEE);
    }

    @Test
    void annulee_nePeutPlusTransitionner() {
        distribution.transitionnerVers(StatutDistribution.ANNULEE, "test");
        assertThatThrownBy(() -> distribution.transitionnerVers(StatutDistribution.PUBLIEE, null))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void demarrer_nEmettreAucunEvenementKafka() {
        distribution.transitionnerVers(StatutDistribution.PUBLIEE, null);
        when(distributionRepository.findById(distributionId)).thenReturn(Optional.of(distribution));
        when(distributionRepository.save(any(Distribution.class))).thenReturn(distribution);
        when(creneauRepository.findByDistributionIdOrderByHeureDebut(distributionId))
            .thenReturn(List.of());

        DistributionResponse response = service.demarrer(distributionId);

        assertThat(response.statut()).isEqualTo("EN_COURS");
        verify(eventPublisher, never()).publierPubliee(any(), any());
        verify(eventPublisher, never()).publierAnnulee(any(), any());
    }
}
