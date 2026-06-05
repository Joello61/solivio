package com.solivio.api.identity.infrastructure.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Argon2id comme encoder de mot de passe (recommandation OWASP 2025).
 * Parametres : memoire 19 Mo, 2 iterations, 1 thread de parallelisme.
 * saltLength et hashLength en octets (16 et 32 respectivement).
 */
@Configuration
public class PasswordConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new Argon2PasswordEncoder(16, 32, 1, 19456, 2);
    }
}
