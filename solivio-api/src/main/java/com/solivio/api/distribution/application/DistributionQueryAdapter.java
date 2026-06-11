package com.solivio.api.distribution.application;

import com.solivio.api.distribution.domain.Creneau;
import com.solivio.api.distribution.domain.Distribution;
import com.solivio.api.distribution.domain.StatutDistribution;
import com.solivio.api.distribution.infrastructure.persistence.CreneauRepository;
import com.solivio.api.distribution.infrastructure.persistence.DistributionRepository;
import com.solivio.api.shared.distribution.DistributionQueryPort;
import com.solivio.api.shared.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
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
            d.getModeCreneau().name(),
            d.getBaseRepartition().name(),
            d.getDate()
        );
    }

    @Override
    public CreneauInfo trouverCreneau(UUID creneauId, UUID distributionId) {
        Creneau c = creneauRepository.findByIdAndDistributionId(creneauId, distributionId)
            .orElseThrow(() -> new NotFoundException(
                "Creneau " + creneauId + " introuvable pour distribution " + distributionId
            ));
        return new CreneauInfo(c.getId(), c.getCapacite(), c.getHeureDebut(), c.getHeureFin());
    }

    @Override
    public DistributionDetailInfo trouverDistributionDetails(UUID distributionId) {
        Distribution d = distributionRepository.findById(distributionId)
            .orElseThrow(() -> new NotFoundException("Distribution introuvable : " + distributionId));
        return new DistributionDetailInfo(
            d.getId(),
            d.getTitre(),
            d.getDate(),
            d.getLieu() != null ? d.getLieu().getAdresseFormatee() : null,
            d.getMotifAnnulation()
        );
    }

    @Override
    public List<UUID> trouverDistributionsPublieesPourDate(LocalDate date) {
        return distributionRepository.findByDateAndStatut(date, StatutDistribution.PUBLIEE)
            .stream()
            .map(Distribution::getId)
            .toList();
    }

    @Override
    public List<DistributionDetailInfo> trouverDetailsParIds(List<UUID> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }
        return distributionRepository.findAllById(ids).stream()
            .map(d -> new DistributionDetailInfo(
                d.getId(), d.getTitre(), d.getDate(),
                d.getLieu() != null ? d.getLieu().getAdresseFormatee() : null,
                d.getMotifAnnulation()
            ))
            .toList();
    }

    @Override
    public List<UUID> trouverIdsTermineesEntre(LocalDate debut, LocalDate fin) {
        return distributionRepository
            .findByDateBetweenAndStatut(debut, fin, StatutDistribution.TERMINEE)
            .stream()
            .map(Distribution::getId)
            .toList();
    }
}
