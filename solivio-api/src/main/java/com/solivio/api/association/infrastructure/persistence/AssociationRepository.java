package com.solivio.api.association.infrastructure.persistence;

import com.solivio.api.association.domain.Association;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface AssociationRepository extends JpaRepository<Association, UUID> {

    @Query("SELECT a FROM Association a")
    Optional<Association> findUnique();
}
