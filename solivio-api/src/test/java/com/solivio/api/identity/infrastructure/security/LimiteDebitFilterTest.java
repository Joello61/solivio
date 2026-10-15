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

class LimiteDebitFilterTest {

    private final AtomicReference<Instant> maintenant = new AtomicReference<>(Instant.parse("2026-10-07T10:00:00Z"));
    private final Clock horloge = new Clock() {
        @Override public ZoneOffset getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(java.time.ZoneId zone) { return this; }
        @Override public Instant instant() { return maintenant.get(); }
    };
    private final LimiteDebitFilter filtre = LimiteDebitFilter.authentification(horloge, 3);
    private final LimiteDebitFilter filtrePublic = LimiteDebitFilter.lecturePublique(horloge, 2);

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

    @Test
    void limiteLaLecturePubliqueEnGetSeulement() throws Exception {
        String chemin = "/api/public/distributions/prochaines";
        assertThat(appeler(filtrePublic, "GET", chemin, "10.0.0.1").getStatus()).isEqualTo(200);
        assertThat(appeler(filtrePublic, "GET", chemin, "10.0.0.1").getStatus()).isEqualTo(200);

        MockHttpServletResponse bloquee = appeler(filtrePublic, "GET", chemin, "10.0.0.1");
        assertThat(bloquee.getStatus()).isEqualTo(429);
        assertThat(bloquee.getContentAsString()).contains("TOO_MANY_REQUESTS");
        assertThat(appeler(filtrePublic, "GET", "/api/public/logo", "10.0.0.1").getStatus()).isEqualTo(200);
        assertThat(appeler(filtrePublic, "POST", "/api/auth/login", "10.0.0.1").getStatus()).isEqualTo(200);
    }

    private MockHttpServletResponse appeler(String chemin, String ip) throws Exception {
        return appeler(filtre, "POST", chemin, ip);
    }

    private static MockHttpServletResponse appeler(LimiteDebitFilter f, String methode, String chemin, String ip)
            throws Exception {
        MockHttpServletRequest requete = new MockHttpServletRequest(methode, chemin);
        requete.setRemoteAddr(ip);
        MockHttpServletResponse reponse = new MockHttpServletResponse();
        f.doFilter(requete, reponse, new MockFilterChain());
        return reponse;
    }
}
