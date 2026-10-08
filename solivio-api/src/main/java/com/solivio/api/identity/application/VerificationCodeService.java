package com.solivio.api.identity.application;

import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.VerificationCode;
import com.solivio.api.identity.infrastructure.persistence.VerificationCodeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;

/**
 * Gestion des codes de verification a 6 chiffres.
 * Duree de vie : 15 minutes. Un seul code actif par type et par compte.
 */
@Service
public class VerificationCodeService {

    private static final int CODE_EXPIRATION_MINUTES = 15;
    static final int MAX_TENTATIVES = 5;
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

    /**
     * Valide le code le plus recent du type demande. Un code a 6 chiffres se
     * devine en un million d'essais : apres MAX_TENTATIVES erreurs, il est brule
     * et l'utilisateur doit en redemander un. Transaction propre : l'appelant
     * leve une exception sur un code faux, ce qui annulerait le compteur.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean valider(Compte compte, String code, String type) {
        return repository
            .findTopByCompteIdAndTypeAndUtiliseFalseOrderByCreeADesc(compte.getId(), type)
            .filter(VerificationCode::estValide)
            .map(vc -> {
                boolean correct = code != null && MessageDigest.isEqual(
                    vc.getCode().getBytes(StandardCharsets.UTF_8), code.getBytes(StandardCharsets.UTF_8));
                if (correct) {
                    vc.setUtilise(true);
                } else {
                    vc.setTentatives(vc.getTentatives() + 1);
                    if (vc.getTentatives() >= MAX_TENTATIVES) {
                        vc.setUtilise(true);
                    }
                }
                repository.save(vc);
                return correct;
            })
            .orElse(false);
    }
}
