package com.solivio.api.identity.infrastructure.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class LimiteDebitAuthFilterTest {

    private final AtomicReference<Instant> maintenant = new AtomicReference<>(Instant.parse("2026-10-07T10:00:00Z"));
    private final Clock horloge = new Clock() {
        @Override public ZoneOffset getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(java.time.ZoneId zone) { return this; }
        @Override public Instant instant() { return maintenant.get(); }
    };
    private final LimiteDebitAuthFilter filtre = new LimiteDebitAuthFilter(horloge, 3);

    @Test
    void bloqueAuDelaDuSeuilPuisLibereALaFenetreSuivante() throws Exception {
        for (int i = 0; i < 3; i++) {
            assertThat(appeler("/api/auth/login", "10.0.0.1").getStatus()).isEqualTo(200);
        }

        MockHttpServletResponse bloquee = appeler("/api/auth/login", "10.0.0.1");
        assertThat(bloquee.getStatus()).isEqualTo(429);
        assertThat(bloquee.getHeader("Retry-After")).isEqualTo("60");

        maintenant.set(maintenant.get().plus(Duration.ofMinutes(1)));
        assertThat(appeler("/api/auth/login", "10.0.0.1").getStatus()).isEqualTo(200);
    }

    @Test
    void compteSeparementParAdresseEtParChemin() throws Exception {
        for (int i = 0; i < 3; i++) {
            appeler("/api/auth/login", "10.0.0.1");
        }

        assertThat(appeler("/api/auth/login", "10.0.0.2").getStatus()).isEqualTo(200);
        assertThat(appeler("/api/auth/forgot-password", "10.0.0.1").getStatus()).isEqualTo(200);
    }

    @Test
    void neLimitePasLesAutresPointsDEntree() throws Exception {
        for (int i = 0; i < 10; i++) {
            assertThat(appeler("/api/distributions", "10.0.0.1").getStatus()).isEqualTo(200);
        }
    }

    private MockHttpServletResponse appeler(String chemin, String ip) throws Exception {
        MockHttpServletRequest requete = new MockHttpServletRequest("POST", chemin);
        requete.setRemoteAddr(ip);
        MockHttpServletResponse reponse = new MockHttpServletResponse();
        filtre.doFilter(requete, reponse, new MockFilterChain());
        return reponse;
    }
}
