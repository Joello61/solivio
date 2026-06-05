package com.solivio.api.identity.application;

import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.VerificationCode;
import com.solivio.api.identity.infrastructure.persistence.VerificationCodeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;

/**
 * Gestion des codes de verification a 6 chiffres.
 * Duree de vie : 15 minutes. Un seul code actif par type et par compte.
 */
@Service
public class VerificationCodeService {

    private static final int CODE_EXPIRATION_MINUTES = 15;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final VerificationCodeRepository repository;

    public VerificationCodeService(VerificationCodeRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public VerificationCode generer(Compte compte, String type) {
        // Invalide les codes precedents du meme type
        repository.invaliderTousPourCompteEtType(compte.getId(), type);

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        Instant expiration = Instant.now().plusSeconds(CODE_EXPIRATION_MINUTES * 60L);
        VerificationCode vc = new VerificationCode(compte, code, type, expiration);
        return repository.save(vc);
    }

    @Transactional
    public boolean valider(Compte compte, String code, String type) {
        return repository
            .findTopByCompteIdAndTypeAndUtiliseFalseOrderByCreeADesc(compte.getId(), type)
            .filter(vc -> vc.estValide() && vc.getCode().equals(code))
            .map(vc -> {
                vc.setUtilise(true);
                repository.save(vc);
                return true;
            })
            .orElse(false);
    }
}
