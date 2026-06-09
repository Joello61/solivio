package com.solivio.api.statistique.application;

import com.solivio.api.shared.distribution.DistributionQueryPort;
import com.solivio.api.shared.statistique.StatistiqueInscriptionPort;
import com.solivio.api.shared.statistique.StatistiqueInscriptionPort.StatsDistribution;
import com.solivio.api.statistique.domain.StatistiqueDistribution;
import com.solivio.api.statistique.infrastructure.persistence.StatistiqueDistributionRepository;
import com.solivio.api.statistique.infrastructure.web.dto.StatistiqueDistributionResponse;
import com.solivio.api.statistique.infrastructure.web.dto.StatistiquePeriodeResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StatistiqueServiceTest {

    @Mock private StatistiqueDistributionRepository statsRepository;
    @Mock private StatistiqueInscriptionPort inscriptionPort;
    @Mock private DistributionQueryPort distributionQueryPort;

    private StatistiqueService service;

    @BeforeEach
    void setUp() {
        service = new StatistiqueService(statsRepository, inscriptionPort, distributionQueryPort);
    }

    @Test
    void calculerEtSauvegarder_persisteLesStatsCalculees() {
        UUID distId = UUID.randomUUID();
        LocalDate date = LocalDate.of(2026, 6, 10);
        StatsDistribution stats = new StatsDistribution(80, 15, 70, 5, 5);

        when(inscriptionPort.calculerStatsDistribution(distId)).thenReturn(stats);
        when(statsRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.calculerEtSauvegarder(distId, date);

        ArgumentCaptor<StatistiqueDistribution> captor = ArgumentCaptor.forClass(
            StatistiqueDistribution.class
        );
        verify(statsRepository).save(captor.capture());
        StatistiqueDistribution saved = captor.getValue();

        assertThat(saved.getDistributionId()).isEqualTo(distId);
        assertThat(saved.getDistributionDate()).isEqualTo(date);
        assertThat(saved.getNbInscritsBeneficiaires()).isEqualTo(80);
        assertThat(saved.getNbInscritsBenevoles()).isEqualTo(15);
        assertThat(saved.getNbPresentsBeneficiaires()).isEqualTo(70);
        assertThat(saved.getNbAbsentsBeneficiaires()).isEqualTo(5);
        assertThat(saved.getNbNonPointes()).isEqualTo(5);
        // 70/80 * 100 = 87.50
        assertThat(saved.getTauxPresence()).isEqualByComparingTo(new BigDecimal("87.50"));
    }

    @Test
    void calculerEtSauvegarder_tauxPresenceZeroSiAucunInscrit() {
        UUID distId = UUID.randomUUID();
        StatsDistribution stats = new StatsDistribution(0, 0, 0, 0, 0);

        when(inscriptionPort.calculerStatsDistribution(distId)).thenReturn(stats);
        when(statsRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.calculerEtSauvegarder(distId, LocalDate.now());

        ArgumentCaptor<StatistiqueDistribution> captor = ArgumentCaptor.forClass(
            StatistiqueDistribution.class
        );
        verify(statsRepository).save(captor.capture());
        assertThat(captor.getValue().getTauxPresence()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void trouverParDistribution_retourneResponseSiExiste() {
        UUID distId = UUID.randomUUID();
        StatistiqueDistribution entite = new StatistiqueDistribution(
            distId, LocalDate.of(2026, 5, 1), 50, 10, 40, 5, 5
        );
        when(statsRepository.findById(distId)).thenReturn(Optional.of(entite));

        Optional<StatistiqueDistributionResponse> result = service.trouverParDistribution(distId);

        assertThat(result).isPresent();
        assertThat(result.get().distributionId()).isEqualTo(distId);
        assertThat(result.get().nbInscritsBeneficiaires()).isEqualTo(50);
        assertThat(result.get().tauxPresence()).isEqualByComparingTo(new BigDecimal("80.00"));
    }

    @Test
    void trouverParDistribution_retourneVideSiAbsent() {
        UUID distId = UUID.randomUUID();
        when(statsRepository.findById(distId)).thenReturn(Optional.empty());

        Optional<StatistiqueDistributionResponse> result = service.trouverParDistribution(distId);

        assertThat(result).isEmpty();
    }

    @Test
    void aggregerPeriode_agregeBienTousLesIndicateurs() {
        LocalDate debut = LocalDate.of(2026, 5, 1);
        LocalDate fin = LocalDate.of(2026, 5, 31);
        List<UUID> ids = List.of(UUID.randomUUID(), UUID.randomUUID());

        when(distributionQueryPort.trouverIdsTermineesEntre(debut, fin)).thenReturn(ids);
        when(inscriptionPort.compterBeneficiairesDistinctsServis(ids)).thenReturn(95L);
        when(inscriptionPort.compterBenevolesDistincts(ids)).thenReturn(20L);

        StatistiquePeriodeResponse result = service.aggregerPeriode(debut, fin);

        assertThat(result.nbDistributions()).isEqualTo(2L);
        assertThat(result.nbBeneficiairesDistinctsServis()).isEqualTo(95L);
        assertThat(result.nbBenevolesDistincts()).isEqualTo(20L);
        assertThat(result.debut()).isEqualTo(debut);
        assertThat(result.fin()).isEqualTo(fin);
    }

    @Test
    void aggregerPeriode_retourneZerosSiAucuneDistribution() {
        LocalDate debut = LocalDate.of(2026, 4, 1);
        LocalDate fin = LocalDate.of(2026, 4, 30);

        when(distributionQueryPort.trouverIdsTermineesEntre(debut, fin)).thenReturn(List.of());
        when(inscriptionPort.compterBeneficiairesDistinctsServis(List.of())).thenReturn(0L);
        when(inscriptionPort.compterBenevolesDistincts(List.of())).thenReturn(0L);

        StatistiquePeriodeResponse result = service.aggregerPeriode(debut, fin);

        assertThat(result.nbDistributions()).isZero();
        assertThat(result.nbBeneficiairesDistinctsServis()).isZero();
        assertThat(result.nbBenevolesDistincts()).isZero();
    }
}
