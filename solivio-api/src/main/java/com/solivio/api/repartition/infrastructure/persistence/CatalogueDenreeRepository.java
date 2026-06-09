package com.solivio.api.repartition.infrastructure.persistence;

import com.solivio.api.repartition.domain.CatalogueDenree;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CatalogueDenreeRepository extends JpaRepository<CatalogueDenree, UUID> {

    List<CatalogueDenree> findByLibelleContainingIgnoreCaseOrderByLibelleAsc(String libelle);

    List<CatalogueDenree> findAllByOrderByLibelleAsc();

    boolean existsByLibelleIgnoreCase(String libelle);
}
