package com.solivio.api.identity.infrastructure.persistence;

import com.solivio.api.identity.domain.Affiliation;
import com.solivio.api.identity.domain.Personne;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface AffiliationRepository extends JpaRepository<Affiliation, UUID> {

    List<Affiliation> findByPersonne(Personne personne);

    @Query("SELECT a FROM Affiliation a WHERE a.personne = :personne AND a.dateFin IS NULL")
    List<Affiliation> findActivesByPersonne(Personne personne);
}
