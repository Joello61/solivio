package com.solivio.api.identity.infrastructure.persistence;

import com.solivio.api.identity.domain.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("UPDATE RefreshToken r SET r.revoque = true WHERE r.compte.id = :compteId")
    void revoquerTousParCompte(UUID compteId);

    @Modifying
    @Query("DELETE FROM RefreshToken r WHERE r.expireA < :maintenant OR r.revoque = true")
    void supprimerExpires(Instant maintenant);
}
