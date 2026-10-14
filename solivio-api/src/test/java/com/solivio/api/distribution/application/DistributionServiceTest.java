package com.solivio.api.distribution.application;

import com.solivio.api.audit.application.AuditService;
import com.solivio.api.distribution.domain.Creneau;
import com.solivio.api.distribution.domain.Distribution;
import com.solivio.api.distribution.domain.ModeCreneauDistribution;
import com.solivio.api.distribution.domain.StatutDistribution;
import com.solivio.api.distribution.infrastructure.evenements.DistributionEventPublisher;
import com.solivio.api.distribution.infrastructure.persistence.CreneauRepository;
import com.solivio.api.distribution.infrastructure.persistence.DistributionRepository;
import com.solivio.api.distribution.infrastructure.web.dto.AjouterCreneauRequest;
import com.solivio.api.distribution.infrastructure.web.dto.CreateDistributionRequest;
import com.solivio.api.distribution.infrastructure.web.dto.DistributionResponse;
import com.solivio.api.shared.exception.ConflictException;
import com.solivio.api.shared.exception.NotFoundException;
import com.solivio.api.shared.association.AssociationQueryPort;
import com.solivio.api.shared.identity.PersonneQueryPort;
import com.solivio.api.shared.inscription.InscriptionQueryPort;
import com.solivio.api.shared.temps.HorlogeAssociation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DistributionServiceTest {

    @Mock private DistributionRepository distributionRepository;
    @Mock private CreneauRepository creneauRepository;
    @Mock private DistributionEventPublisher eventPublisher;
    @Mock private PersonneQueryPort personneQueryPort;
    @Mock private AssociationQueryPort associationQueryPort;
    @Mock private AuditService auditService;
    @Mock private InscriptionQueryPort inscriptionQueryPort;

    private static final ZoneId PARIS = ZoneId.of("Europe/Paris");

    private DistributionService service;
    private UUID distributionId;
    private UUID creeParId;
    private Distribution distribution;

    @BeforeEach
    void setUp() {
        service = serviceA(Clock.systemUTC());
        distributionId = UUID.randomUUID();
        creeParId = UUID.randomUUID();
        distribution = new Distribution(
            "Distribution de test", null, null, LocalDate.now().plusDays(7),
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
            "Distribution de test", null, null, LocalDate.now().plusDays(7),
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

        DistributionResponse response = service.publier(distributionId);

        assertThat(response.statut()).isEqualTo("PUBLIEE");
        // La publication n'a aucun consommateur : aucun evenement n'est emis.
        verifyNoInteractions(eventPublisher);
    }

    @Test
    void publier_echoueSiDistributionInexistante() {
        when(distributionRepository.findById(distributionId)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.publier(distributionId))
            .isInstanceOf(NotFoundException.class);
    }

    @Test
    void annuler_emettreEvenementEtStockerMotif() {
        when(distributionRepository.findById(distributionId)).thenReturn(Optional.of(distribution));
        when(distributionRepository.save(any(Distribution.class))).thenReturn(distribution);
        when(creneauRepository.findByDistributionIdOrderByHeureDebut(distributionId))
            .thenReturn(List.of());

        DistributionResponse response = service.annuler(distributionId, "Raison X");

        assertThat(response.statut()).isEqualTo("ANNULEE");
        assertThat(response.motifAnnulation()).isEqualTo("Raison X");
        verify(eventPublisher).publierAnnulee(eq(distributionId), any(LocalDate.class));
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
    void demarrer_nEmetAucunEvenement() {
        // Distribution a la date du jour : demarrage autorise
        Distribution distribAujourdhui = new Distribution(
            "Distribution de test", null, null, LocalDate.now(),
            50, 10, ModeCreneauDistribution.CRENEAU_UNIQUE, creeParId
        );
        distribAujourdhui.setId(distributionId);
        distribAujourdhui.transitionnerVers(StatutDistribution.PUBLIEE, null);
        when(distributionRepository.findById(distributionId)).thenReturn(Optional.of(distribAujourdhui));
        when(distributionRepository.save(any(Distribution.class))).thenReturn(distribAujourdhui);
        when(creneauRepository.findByDistributionIdOrderByHeureDebut(distributionId))
            .thenReturn(List.of());

        DistributionResponse response = service.demarrer(distributionId);

        assertThat(response.statut()).isEqualTo("EN_COURS");
        verify(eventPublisher, never()).publierAnnulee(any(), any());
    }

    @Test
    void demarrer_echoueSiDateFuture() {
        // setUp() cree une distribution avec date = today+7
        distribution.transitionnerVers(StatutDistribution.PUBLIEE, null);
        when(distributionRepository.findById(distributionId)).thenReturn(Optional.of(distribution));

        assertThatThrownBy(() -> service.demarrer(distributionId))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("avant sa date");
    }

    @Test
    void demarrer_autoriseSiDatePassee() {
        Distribution distribPassee = new Distribution(
            "Distribution passee", null, null, LocalDate.now().minusDays(1),
            50, 10, ModeCreneauDistribution.CRENEAU_UNIQUE, creeParId
        );
        distribPassee.setId(distributionId);
        distribPassee.transitionnerVers(StatutDistribution.PUBLIEE, null);
        when(distributionRepository.findById(distributionId)).thenReturn(Optional.of(distribPassee));
        when(distributionRepository.save(any(Distribution.class))).thenReturn(distribPassee);
        when(creneauRepository.findByDistributionIdOrderByHeureDebut(distributionId))
            .thenReturn(List.of());

        DistributionResponse response = service.demarrer(distributionId);

        assertThat(response.statut()).isEqualTo("EN_COURS");
    }

    // --- I11 : listes ---

    @Test
    void lister_chargeLesCreneauxEnUneSeuleRequete() {
        Distribution autre = new Distribution("Autre", null, null, LocalDate.now().plusDays(9),
            20, null, ModeCreneauDistribution.CRENEAUX_DECOUPES, creeParId);
        autre.setId(UUID.randomUUID());
        when(distributionRepository.findAllByOrderByDateDesc()).thenReturn(List.of(autre, distribution));
        Creneau creneau = new Creneau(autre.getId(), LocalTime.of(9, 0), LocalTime.of(10, 0), 10);
        creneau.setId(UUID.randomUUID());
        when(creneauRepository.findByDistributionIdInOrderByHeureDebut(List.of(autre.getId(), distributionId)))
            .thenReturn(List.of(creneau));

        List<DistributionResponse> liste = service.lister();

        assertThat(liste).hasSize(2);
        assertThat(liste.get(0).creneaux()).hasSize(1);
        assertThat(liste.get(1).creneaux()).isEmpty();
        verify(creneauRepository, never()).findByDistributionIdOrderByHeureDebut(any());
    }

    // --- I7 : fuseau de l'association ---

    // A 0h30 a Paris, il est encore la veille en UTC (fuseau du conteneur) :
    // la distribution du jour doit pouvoir demarrer.
    @Test
    void demarrer_aMinuitTrenteAParis_utiliseLaDateDeLAssociation() {
        DistributionService serviceAMinuit = serviceA(
            Clock.fixed(Instant.parse("2026-10-14T22:30:00Z"), ZoneOffset.UTC));
        Distribution duJour = new Distribution("Distribution", null, null, LocalDate.of(2026, 10, 15),
            50, 10, ModeCreneauDistribution.CRENEAU_UNIQUE, creeParId);
        duJour.setId(distributionId);
        duJour.transitionnerVers(StatutDistribution.PUBLIEE, null);
        when(distributionRepository.findById(distributionId)).thenReturn(Optional.of(duJour));
        when(distributionRepository.save(any(Distribution.class))).thenAnswer(inv -> inv.getArgument(0));

        DistributionResponse response = serviceAMinuit.demarrer(distributionId);

        assertThat(response.statut()).isEqualTo("EN_COURS");
    }

    // --- I8 : validation a la creation ---

    @Test
    void creer_refuseUneDatePassee() {
        CreateDistributionRequest hier = new CreateDistributionRequest("Distribution", null, null,
            LocalDate.now(PARIS).minusDays(1), 10, null, null,
            List.of(new AjouterCreneauRequest(LocalTime.of(10, 0), LocalTime.of(12, 0), 10)));

        assertThatThrownBy(() -> service.creer(hier, "coord@example.com"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("deja passee");
        verifyNoInteractions(distributionRepository);
    }

    @Test
    void creer_refusePlusieursCreneauxEnCreneauUnique() {
        CreateDistributionRequest deuxCreneaux = new CreateDistributionRequest("Distribution", null, null,
            LocalDate.now(PARIS).plusDays(3), 10, null, "CRENEAU_UNIQUE",
            List.of(new AjouterCreneauRequest(LocalTime.of(10, 0), LocalTime.of(11, 0), 5),
                new AjouterCreneauRequest(LocalTime.of(11, 0), LocalTime.of(12, 0), 5)));

        assertThatThrownBy(() -> service.creer(deuxCreneaux, "coord@example.com"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("un seul creneau");
    }

    private DistributionService serviceA(Clock clock) {
        lenient().when(associationQueryPort.fuseauHoraire()).thenReturn(PARIS);
        return new DistributionService(distributionRepository, creneauRepository, eventPublisher,
            personneQueryPort, new HorlogeAssociation(clock, associationQueryPort), auditService,
            new ReponseDistribution(inscriptionQueryPort));
    }
}
