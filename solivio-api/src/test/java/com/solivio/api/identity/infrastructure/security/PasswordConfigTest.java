package com.solivio.api.identity.infrastructure.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;

class PasswordConfigTest {

    private final PasswordEncoder encoder = new PasswordConfig().passwordEncoder();

    // Argon2 depend de Bouncy Castle : ce test echoue si la dependance disparait
    // du classpath, comme lors du retrait de Spring Cloud Vault qui l'apportait.
    @Test
    void encode_produitUnHashArgon2Verifiable() {
        String hash = encoder.encode("mot-de-passe-solide");

        assertThat(hash).startsWith("$argon2id$");
        assertThat(encoder.matches("mot-de-passe-solide", hash)).isTrue();
        assertThat(encoder.matches("autre", hash)).isFalse();
    }
}
