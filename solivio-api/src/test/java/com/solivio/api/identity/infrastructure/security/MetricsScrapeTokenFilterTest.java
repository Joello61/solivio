package com.solivio.api.identity.infrastructure.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class MetricsScrapeTokenFilterTest {

    @AfterEach
    void nettoyer() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void jetonCorrect_authentifiePrometheus() throws Exception {
        Authentication auth = filtrer("jeton-attendu", "Bearer jeton-attendu");

        assertThat(auth).isNotNull();
        assertThat(auth.getAuthorities()).extracting(Object::toString).containsExactly("ROLE_METRICS_SCRAPER");
    }

    @Test
    void jetonIncorrect_nAuthentifiePas() throws Exception {
        assertThat(filtrer("jeton-attendu", "Bearer autre-jeton")).isNull();
    }

    @Test
    void sansEnTete_nAuthentifiePas() throws Exception {
        assertThat(filtrer("jeton-attendu", null)).isNull();
    }

    @Test
    void sansJetonConfigure_personneNEstAuthentifie() throws Exception {
        assertThat(filtrer("", "Bearer ")).isNull();
    }

    private Authentication filtrer(String jetonConfigure, String enTete) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        if (enTete != null) {
            request.addHeader("Authorization", enTete);
        }
        AtomicReference<Authentication> resultat = new AtomicReference<>();
        new MetricsScrapeTokenFilter(jetonConfigure).doFilter(request, new MockHttpServletResponse(),
            (req, res) -> resultat.set(SecurityContextHolder.getContext().getAuthentication()));
        return resultat.get();
    }
}
