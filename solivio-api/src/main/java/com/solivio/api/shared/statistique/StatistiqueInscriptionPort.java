package com.solivio.api.shared.statistique;

import java.util.List;
import java.util.UUID;

/**
 * Port de lecture pour les donnees d'inscription utilisees par le module statistiques.
 * Implemente par le module inscriptions pour respecter les frontieres modulaires.
 */
public interface StatistiqueInscriptionPort {

    StatsDistribution calculerStatsDistribution(UUID distributionId);

    long compterBeneficiairesDistinctsServis(List<UUID> distributionIds);

    long compterBenevolesDistincts(List<UUID> distributionIds);

    record StatsDistribution(
        int nbInscritsBeneficiaires,
        int nbInscritsBenevoles,
        int nbPresentsBeneficiaires,
        int nbAbsentsBeneficiaires,
        int nbNonPointes
    ) {}
}
