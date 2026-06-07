package com.solivio.api.distribution.infrastructure.persistence;

import com.solivio.api.distribution.domain.Distribution;
import com.solivio.api.distribution.domain.StatutDistribution;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DistributionRepository extends JpaRepository<Distribution, UUID> {

    List<Distribution> findAllByOrderByDateDesc();

    List<Distribution> findByStatutOrderByDateDesc(StatutDistribution statut);
}
