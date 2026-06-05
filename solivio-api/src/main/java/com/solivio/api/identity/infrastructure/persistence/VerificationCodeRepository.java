package com.solivio.api.identity.infrastructure.persistence;

import com.solivio.api.identity.domain.VerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface VerificationCodeRepository extends JpaRepository<VerificationCode, UUID> {

    Optional<VerificationCode> findTopByCompteIdAndTypeAndUtiliseFalseOrderByCreeADesc(
        UUID compteId, String type);

    @Modifying
    @Query("UPDATE VerificationCode v SET v.utilise = true WHERE v.compte.id = :compteId AND v.type = :type")
    void invaliderTousPourCompteEtType(UUID compteId, String type);
}
