package com.solivio.api.identity.infrastructure.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jspecify.annotations.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;

/**
 * Authentifie Prometheus sur le port de gestion par le jeton METRICS_SCRAPE_TOKEN
 * (en-tete Authorization: Bearer). Sans jeton configure, personne n'est authentifie.
 */
class MetricsScrapeTokenFilter extends OncePerRequestFilter {

    static final String ROLE = "METRICS_SCRAPER";
    private static final String BEARER_PREFIX = "Bearer ";

    private final byte[] empreinteAttendue;

    MetricsScrapeTokenFilter(String jeton) {
        this.empreinteAttendue = jeton == null || jeton.isBlank() ? null : empreinte(jeton);
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (empreinteAttendue != null && header != null && header.startsWith(BEARER_PREFIX)
                && jetonValide(header.substring(BEARER_PREFIX.length()))) {
            SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
                "prometheus", null, List.of(new SimpleGrantedAuthority("ROLE_" + ROLE))));
        }
        filterChain.doFilter(request, response);
    }

    // Comparaison des empreintes a temps constant : ni le contenu ni la longueur
    // du jeton ne fuient par le temps de reponse.
    private boolean jetonValide(String fourni) {
        return MessageDigest.isEqual(empreinteAttendue, empreinte(fourni));
    }

    private static byte[] empreinte(String valeur) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(valeur.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponible", e);
        }
    }
}
