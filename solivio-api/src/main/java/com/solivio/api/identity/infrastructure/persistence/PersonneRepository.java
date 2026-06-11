package com.solivio.api.identity.infrastructure.persistence;

import com.solivio.api.identity.domain.Personne;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PersonneRepository extends JpaRepository<Personne, UUID> {

    Optional<Personne> findByEmail(String email);

    Optional<Personne> findByCompteEmail(String compteEmail);

    boolean existsByEmail(String email);

    @Query("SELECT p FROM Personne p WHERE p.dateSuppression IS NULL AND "
        + "(LOWER(p.nom) LIKE LOWER(CONCAT('%', :terme, '%')) "
        + "OR LOWER(p.prenom) LIKE LOWER(CONCAT('%', :terme, '%'))) "
        + "ORDER BY p.nom ASC, p.prenom ASC")
    List<Personne> rechercherParNomOuPrenom(@Param("terme") String terme);
}
