package com.solivio.api.identity.domain;

import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class CompteTest {

    private static final Duration DUREE = Duration.ofMinutes(15);
    private final Instant maintenant = Instant.parse("2026-10-07T10:00:00Z");
    private final Compte compte = new Compte("a@example.com", "hash", "Nom", "Prenom");

    @Test
    void enregistrerEchecConnexion_neVerrouillePasAvantLeSeuil() {
        for (int i = 0; i < 4; i++) {
            compte.enregistrerEchecConnexion(maintenant, 5, DUREE);
        }

        assertThat(compte.estVerrouille(maintenant)).isFalse();
        assertThat(compte.getEchecsConnexion()).isEqualTo(4);
    }

    @Test
    void enregistrerEchecConnexion_verrouillePourLaDureeAuSeuil() {
        for (int i = 0; i < 5; i++) {
            compte.enregistrerEchecConnexion(maintenant, 5, DUREE);
        }

        assertThat(compte.estVerrouille(maintenant)).isTrue();
        assertThat(compte.estVerrouille(maintenant.plus(DUREE))).isFalse();
        assertThat(compte.getEchecsConnexion()).isZero();
    }

    @Test
    void reinitialiserEchecsConnexion_deverrouille() {
        for (int i = 0; i < 5; i++) {
            compte.enregistrerEchecConnexion(maintenant, 5, DUREE);
        }

        compte.reinitialiserEchecsConnexion();

        assertThat(compte.estVerrouille(maintenant)).isFalse();
        assertThat(compte.getEchecsConnexion()).isZero();
    }
}
