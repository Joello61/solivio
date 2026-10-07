package com.solivio.api.identity.application;

import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.shared.exception.TropDeTentativesException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

/**
 * Verrouillage temporaire d'un compte apres des echecs de connexion consecutifs
 * (ADR-004). Les ecritures ont leur propre transaction : la connexion echouee
 * leve une exception qui annulerait sinon le compteur.
 */
@Service
public class TentativesConnexionService {

    private static final Logger log = LoggerFactory.getLogger(TentativesConnexionService.class);

    static final int SEUIL_ECHECS = 5;
    static final Duration DUREE_VERROUILLAGE = Duration.ofMinutes(15);

    private final CompteRepository compteRepository;

    public TentativesConnexionService(CompteRepository compteRepository) {
        this.compteRepository = compteRepository;
    }

    @Transactional(readOnly = true)
    public void verifierNonVerrouille(String email) {
        compteRepository.findByEmail(email)
            .filter(compte -> compte.estVerrouille(Instant.now()))
            .ifPresent(compte -> {
                throw new TropDeTentativesException(
                    "Trop de tentatives de connexion. Reessayez dans quelques minutes.");
            });
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void enregistrerEchec(String email) {
        compteRepository.findByEmail(email).ifPresent(compte -> {
            compte.enregistrerEchecConnexion(Instant.now(), SEUIL_ECHECS, DUREE_VERROUILLAGE);
            if (compte.estVerrouille(Instant.now())) {
                log.warn("Compte {} verrouille apres {} echecs de connexion", compte.getId(), SEUIL_ECHECS);
            }
            compteRepository.save(compte);
        });
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void reinitialiser(String email) {
        compteRepository.findByEmail(email)
            .filter(compte -> compte.getEchecsConnexion() > 0 || compte.getVerrouilleJusqua() != null)
            .ifPresent(compte -> {
                compte.reinitialiserEchecsConnexion();
                compteRepository.save(compte);
            });
    }
}
