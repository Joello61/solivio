package com.solivio.api.distribution.application;

import com.solivio.api.distribution.domain.Creneau;
import com.solivio.api.distribution.domain.Distribution;
import com.solivio.api.distribution.infrastructure.persistence.CreneauRepository;
import com.solivio.api.distribution.infrastructure.persistence.DistributionRepository;
import com.solivio.api.shared.distribution.DistributionQueryPort;
import com.solivio.api.shared.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class DistributionQueryAdapter implements DistributionQueryPort {

    private final DistributionRepository distributionRepository;
    private final CreneauRepository creneauRepository;

    public DistributionQueryAdapter(
        DistributionRepository distributionRepository,
        CreneauRepository creneauRepository
    ) {
        this.distributionRepository = distributionRepository;
        this.creneauRepository = creneauRepository;
    }

    @Override
    public DistributionInfo trouverDistribution(UUID distributionId) {
        Distribution d = distributionRepository.findById(distributionId)
            .orElseThrow(() -> new NotFoundException("Distribution introuvable : " + distributionId));
        return new DistributionInfo(
            d.getId(),
            d.getStatut().name(),
            d.getCapaciteBeneficiaires(),
            d.getCapaciteBenevoles(),
            d.getModeCreneau().name()
        );
    }

    @Override
    public CreneauInfo trouverCreneau(UUID creneauId, UUID distributionId) {
        Creneau c = creneauRepository.findByIdAndDistributionId(creneauId, distributionId)
            .orElseThrow(() -> new NotFoundException(
                "Creneau " + creneauId + " introuvable pour distribution " + distributionId
            ));
        return new CreneauInfo(c.getId(), c.getCapacite());
    }
}
