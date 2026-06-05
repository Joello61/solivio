package com.solivio.api.identity.infrastructure.persistence;

import com.solivio.api.identity.domain.Personne;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PersonneRepository extends JpaRepository<Personne, UUID> {

    Optional<Personne> findByKeycloakId(String keycloakId);

    Optional<Personne> findByEmail(String email);

    boolean existsByKeycloakId(String keycloakId);
}
