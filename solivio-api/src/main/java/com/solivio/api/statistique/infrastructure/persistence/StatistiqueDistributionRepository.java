package com.solivio.api.statistique.infrastructure.persistence;

import com.solivio.api.statistique.domain.StatistiqueDistribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface StatistiqueDistributionRepository
    extends JpaRepository<StatistiqueDistribution, UUID> {

    List<StatistiqueDistribution> findByDistributionDateBetweenOrderByDistributionDateDesc(
        LocalDate debut, LocalDate fin
    );

    @Query("SELECT s.distributionId FROM StatistiqueDistribution s "
        + "WHERE s.distributionDate BETWEEN :debut AND :fin")
    List<UUID> findDistributionIdsByPeriode(
        @Param("debut") LocalDate debut, @Param("fin") LocalDate fin
    );

    @Query("SELECT COUNT(s) FROM StatistiqueDistribution s "
        + "WHERE s.distributionDate BETWEEN :debut AND :fin")
    long compterDistributionsPeriode(
        @Param("debut") LocalDate debut, @Param("fin") LocalDate fin
    );
}
