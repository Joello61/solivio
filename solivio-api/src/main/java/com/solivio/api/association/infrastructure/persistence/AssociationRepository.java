package com.solivio.api.association.infrastructure.persistence;

import com.solivio.api.association.domain.Association;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AssociationRepository extends JpaRepository<Association, UUID> {

    Optional<Association> findBySlug(String slug);

    Optional<Association> findByCode(String code);

    Optional<Association> findBySousDomaine(String sousDomaine);

    List<Association> findAllByStatut(String statut);
}
