package com.solivio.api.distribution.infrastructure.persistence;

import com.solivio.api.distribution.domain.Creneau;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CreneauRepository extends JpaRepository<Creneau, UUID> {

    List<Creneau> findByDistributionIdOrderByHeureDebut(UUID distributionId);

    Optional<Creneau> findByIdAndDistributionId(UUID id, UUID distributionId);
}
