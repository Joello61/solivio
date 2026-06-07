package com.solivio.api.inscription.infrastructure.persistence;

import com.solivio.api.inscription.domain.RoleBenevoleInscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface RoleBenevoleInscriptionRepository extends JpaRepository<RoleBenevoleInscription, UUID> {

    @Query("SELECT r FROM RoleBenevoleInscription r WHERE r.inscription.id = :inscriptionId ORDER BY r.id ASC")
    List<RoleBenevoleInscription> listerParInscription(@Param("inscriptionId") UUID inscriptionId);
}
