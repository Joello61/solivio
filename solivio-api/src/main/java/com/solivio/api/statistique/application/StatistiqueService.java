package com.solivio.api.statistique.application;

import com.solivio.api.shared.statistique.StatistiqueInscriptionPort;
import com.solivio.api.shared.statistique.StatistiqueInscriptionPort.StatsDistribution;
import com.solivio.api.statistique.domain.StatistiqueDistribution;
import com.solivio.api.statistique.infrastructure.persistence.StatistiqueDistributionRepository;
import com.solivio.api.statistique.infrastructure.web.dto.StatistiqueDistributionResponse;
import com.solivio.api.statistique.infrastructure.web.dto.StatistiquePeriodeResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class StatistiqueService {

    private static final Logger log = LoggerFactory.getLogger(StatistiqueService.class);

    private final StatistiqueDistributionRepository statsRepository;
    private final StatistiqueInscriptionPort inscriptionPort;

    public StatistiqueService(
        StatistiqueDistributionRepository statsRepository,
        StatistiqueInscriptionPort inscriptionPort
    ) {
        this.statsRepository = statsRepository;
        this.inscriptionPort = inscriptionPort;
    }

    public void calculerEtSauvegarder(UUID distributionId, LocalDate distributionDate) {
        StatsDistribution stats = inscriptionPort.calculerStatsDistribution(distributionId);
        StatistiqueDistribution entite = new StatistiqueDistribution(
            distributionId,
            distributionDate,
            stats.nbInscritsBeneficiaires(),
            stats.nbInscritsBenevoles(),
            stats.nbPresentsBeneficiaires(),
            stats.nbAbsentsBeneficiaires(),
            stats.nbNonPointes()
        );
        statsRepository.save(entite);
        log.debug("Stats calculees pour distribution {} : {} inscrits, {} presents",
            distributionId, stats.nbInscritsBeneficiaires(), stats.nbPresentsBeneficiaires());
    }

    @Transactional(readOnly = true)
    public Optional<StatistiqueDistributionResponse> trouverParDistribution(UUID distributionId) {
        return statsRepository.findById(distributionId).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<StatistiqueDistributionResponse> listerParPeriode(LocalDate debut, LocalDate fin) {
        return statsRepository
            .findByDistributionDateBetweenOrderByDistributionDateDesc(debut, fin)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public StatistiquePeriodeResponse aggregerPeriode(LocalDate debut, LocalDate fin) {
        long nbDistributions = statsRepository.compterDistributionsPeriode(debut, fin);
        List<UUID> ids = statsRepository.findDistributionIdsByPeriode(debut, fin);
        long nbBeneficiaires = inscriptionPort.compterBeneficiairesDistinctsServis(ids);
        long nbBenevoles = inscriptionPort.compterBenevolesDistincts(ids);
        return new StatistiquePeriodeResponse(debut, fin, nbDistributions, nbBeneficiaires, nbBenevoles);
    }

    private StatistiqueDistributionResponse toResponse(StatistiqueDistribution s) {
        return new StatistiqueDistributionResponse(
            s.getDistributionId(),
            s.getDistributionDate(),
            s.getNbInscritsBeneficiaires(),
            s.getNbInscritsBenevoles(),
            s.getNbPresentsBeneficiaires(),
            s.getNbAbsentsBeneficiaires(),
            s.getNbNonPointes(),
            s.getTauxPresence(),
            s.getDateCalcul()
        );
    }
}
