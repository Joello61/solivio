package com.solivio.api.shared.distribution;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public interface DistributionQueryPort {

    DistributionInfo trouverDistribution(UUID distributionId);

    CreneauInfo trouverCreneau(UUID creneauId, UUID distributionId);

    DistributionDetailInfo trouverDistributionDetails(UUID distributionId);

    List<UUID> trouverDistributionsPublieesPourDate(LocalDate date);

    List<DistributionDetailInfo> trouverDetailsParIds(List<UUID> ids);

    List<UUID> trouverIdsTermineesEntre(LocalDate debut, LocalDate fin);

    record DistributionInfo(
        UUID id,
        String statut,
        int capaciteBeneficiaires,
        Integer capaciteBenevoles,
        String modeCreneau,
        String baseRepartition,
        LocalDate date
    ) {}

    record CreneauInfo(UUID id, int capacite, LocalTime heureDebut, LocalTime heureFin) {}

    record DistributionDetailInfo(
        UUID id,
        String titre,
        LocalDate date,
        String lieu,
        String motifAnnulation
    ) {}
}
