package com.solivio.api.inscription.infrastructure.persistence;

import com.solivio.api.inscription.domain.PointageAdHoc;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PointageAdHocRepository extends JpaRepository<PointageAdHoc, UUID> {

    long countByDistributionId(UUID distributionId);

    List<PointageAdHoc> findByDistributionIdOrderByNomAscPrenomAsc(UUID distributionId);
}
