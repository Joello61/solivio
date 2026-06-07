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

    record DistributionInfo(
        UUID id,
        String statut,
        int capaciteBeneficiaires,
        Integer capaciteBenevoles,
        String modeCreneau,
        String baseRepartition
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
