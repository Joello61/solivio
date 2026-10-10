package com.solivio.api.distribution.infrastructure.persistence;

import com.solivio.api.distribution.domain.Distribution;
import com.solivio.api.distribution.domain.StatutDistribution;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface DistributionRepository extends JpaRepository<Distribution, UUID> {

    List<Distribution> findAllByOrderByDateDesc();

    List<Distribution> findByStatutInAndDateGreaterThanEqualOrderByDateAsc(
        Collection<StatutDistribution> statuts, LocalDate depuis
    );

    List<Distribution> findByDateAndStatut(LocalDate date, StatutDistribution statut);

    List<Distribution> findByDateBetweenAndStatut(
        LocalDate debut, LocalDate fin, StatutDistribution statut
    );

    List<Distribution> findByDateBetweenAndStatutIn(
        LocalDate debut, LocalDate fin, Collection<StatutDistribution> statuts
    );
}
