package com.solivio.api.identity.infrastructure.persistence;

import com.solivio.api.identity.domain.Compte;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface CompteRepository extends JpaRepository<Compte, UUID> {

    Optional<Compte> findByEmail(String email);

    Optional<Compte> findByGoogleId(String googleId);

    boolean existsByEmail(String email);

    // Le pattern est passe depuis Java ("%term%", deja en minuscules) pour eviter
    // l'inference bytea de Hibernate 7 sur les parametres non types dans CONCAT.
    @Query("SELECT c FROM Compte c WHERE "
        + "(:pattern IS NULL OR LOWER(c.nom) LIKE :pattern "
        + " OR LOWER(c.prenom) LIKE :pattern "
        + " OR LOWER(c.email) LIKE :pattern)")
    Page<Compte> rechercherComptes(@Param("pattern") String pattern, Pageable pageable);
}
