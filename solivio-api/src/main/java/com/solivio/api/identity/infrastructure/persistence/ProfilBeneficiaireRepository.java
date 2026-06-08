package com.solivio.api.identity.infrastructure.persistence;

import com.solivio.api.identity.domain.ProfilBeneficiaire;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProfilBeneficiaireRepository extends JpaRepository<ProfilBeneficiaire, UUID> {

    Optional<ProfilBeneficiaire> findByPersonneId(UUID personneId);
}
