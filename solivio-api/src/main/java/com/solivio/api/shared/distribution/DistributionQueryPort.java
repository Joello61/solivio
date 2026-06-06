package com.solivio.api.shared.distribution;

import java.util.UUID;

public interface DistributionQueryPort {

    DistributionInfo trouverDistribution(UUID distributionId);

    CreneauInfo trouverCreneau(UUID creneauId, UUID distributionId);

    record DistributionInfo(
        UUID id,
        String statut,
        int capaciteBeneficiaires,
        Integer capaciteBenevoles,
        String modeCreneau
    ) {}

    record CreneauInfo(UUID id, int capacite) {}
}
