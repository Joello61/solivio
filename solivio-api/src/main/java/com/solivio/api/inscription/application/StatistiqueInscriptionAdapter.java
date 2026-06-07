package com.solivio.api.inscription.application;

import com.solivio.api.inscription.infrastructure.persistence.InscriptionRepository;
import com.solivio.api.shared.statistique.StatistiqueInscriptionPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class StatistiqueInscriptionAdapter implements StatistiqueInscriptionPort {

    private final InscriptionRepository inscriptionRepository;

    public StatistiqueInscriptionAdapter(InscriptionRepository inscriptionRepository) {
        this.inscriptionRepository = inscriptionRepository;
    }

    @Override
    public StatsDistribution calculerStatsDistribution(UUID distributionId) {
        int inscritsB = (int) inscriptionRepository.compterInscritsBeneficiaires(distributionId);
        int inscritsBenevoles = (int) inscriptionRepository.compterInscritsBenevoles(distributionId);
        int presents = (int) inscriptionRepository.compterBeneficiairesPresents(distributionId);
        int absents = (int) inscriptionRepository.compterAbsentsBeneficiaires(distributionId);
        int nonPointes = (int) inscriptionRepository.compterNonPointesBeneficiaires(distributionId);
        return new StatsDistribution(inscritsB, inscritsBenevoles, presents, absents, nonPointes);
    }

    @Override
    public long compterBeneficiairesDistinctsServis(List<UUID> distributionIds) {
        if (distributionIds.isEmpty()) {
            return 0L;
        }
        return inscriptionRepository.compterBeneficiairesDistinctsServis(distributionIds);
    }

    @Override
    public long compterBenevolesDistincts(List<UUID> distributionIds) {
        if (distributionIds.isEmpty()) {
            return 0L;
        }
        return inscriptionRepository.compterBenevolesDistincts(distributionIds);
    }
}
