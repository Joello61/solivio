package com.solivio.api.identity.infrastructure.persistence;

import com.solivio.api.identity.domain.Compte;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CompteRepository extends JpaRepository<Compte, UUID> {

    Optional<Compte> findByEmail(String email);

    Optional<Compte> findByGoogleId(String googleId);

    boolean existsByEmail(String email);
}
