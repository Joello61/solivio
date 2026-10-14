package com.solivio.api.identity.infrastructure.security;

import com.solivio.api.shared.web.ApiError;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jspecify.annotations.NonNull;
import org.springframework.http.HttpStatus;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Clock;
import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Limite le nombre d'appels aux points d'entree publics d'authentification
 * par adresse IP (fenetre fixe d'une minute). Freine le bourrage
 * d'identifiants et l'enumeration ; le verrouillage par compte (AuthService)
 * et le compteur d'essais des codes completent cette protection.
 *
 * Les compteurs sont en memoire : suffisant pour l'instance unique de
 * Solivio, remis a zero a chaque redemarrage. L'adresse IP est celle du client
 * reel grace a server.forward-headers-strategy derriere Traefik.
 */
public class LimiteDebitAuthFilter extends OncePerRequestFilter {

    private static final Duration FENETRE = Duration.ofMinutes(1);
    private static final int TAILLE_MAX_TABLE = 10_000;

    private static final Set<String> CHEMINS_LIMITES = Set.of(
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/refresh",
        "/api/auth/forgot-password",
        "/api/auth/reset-password",
        "/api/auth/verify-email",
        "/api/auth/resend-verification",
        "/api/auth/google/complete-registration"
    );

    private final Clock clock;
    private final int requetesMaxParMinute;
    private final Map<String, Fenetre> fenetres = new ConcurrentHashMap<>();

    public LimiteDebitAuthFilter(Clock clock, int requetesMaxParMinute) {
        this.clock = clock;
        this.requetesMaxParMinute = requetesMaxParMinute;
    }

    private record Fenetre(long debutMillis, int compte) {}

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !"POST".equals(request.getMethod()) || !CHEMINS_LIMITES.contains(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        if (!autoriser(request.getRemoteAddr() + "|" + request.getRequestURI())) {
            response.setHeader("Retry-After", String.valueOf(FENETRE.toSeconds()));
            ApiError.ecrire(response, HttpStatus.TOO_MANY_REQUESTS, "TOO_MANY_ATTEMPTS",
                "Trop de tentatives. Reessayez dans une minute.");
            return;
        }
        chain.doFilter(request, response);
    }

    boolean autoriser(String cle) {
        long maintenant = clock.millis();
        if (fenetres.size() > TAILLE_MAX_TABLE) {
            // Evite une croissance sans fin si de nombreuses adresses defilent.
            fenetres.entrySet().removeIf(e -> maintenant - e.getValue().debutMillis() >= FENETRE.toMillis());
        }
        Fenetre fenetre = fenetres.compute(cle, (k, f) ->
            f == null || maintenant - f.debutMillis() >= FENETRE.toMillis()
                ? new Fenetre(maintenant, 1)
                : new Fenetre(f.debutMillis(), f.compte() + 1));
        return fenetre.compte() <= requetesMaxParMinute;
    }
}
