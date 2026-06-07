package com.solivio.api.repartition.infrastructure.persistence;

import com.solivio.api.repartition.domain.DenreeDistribution;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DenreeDistributionRepository extends JpaRepository<DenreeDistribution, UUID> {

    List<DenreeDistribution> findByDistributionIdOrderByDateCreationAsc(UUID distributionId);

    Optional<DenreeDistribution> findByIdAndDistributionId(UUID id, UUID distributionId);
}
