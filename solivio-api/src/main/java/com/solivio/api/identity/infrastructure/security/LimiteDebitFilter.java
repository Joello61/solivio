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
 * Limite le nombre d'appels a des points d'entree publics par adresse IP
 * (fenetre fixe d'une minute). Sur l'authentification, freine le bourrage
 * d'identifiants et l'enumeration ; le verrouillage par compte (AuthService)
 * et le compteur d'essais des codes completent cette protection. Sur les
 * lectures publiques, borne le cout d'un client abusif.
 *
 * Les compteurs sont en memoire : suffisant pour l'instance unique de
 * Solivio, remis a zero a chaque redemarrage. L'adresse IP est celle du client
 * reel grace a server.forward-headers-strategy derriere Traefik.
 */
public final class LimiteDebitFilter extends OncePerRequestFilter {

    private static final Duration FENETRE = Duration.ofMinutes(1);
    private static final int TAILLE_MAX_TABLE = 10_000;

    private static final Set<String> CHEMINS_AUTH = Set.of(
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/refresh",
        "/api/auth/forgot-password",
        "/api/auth/reset-password",
        "/api/auth/verify-email",
        "/api/auth/resend-verification",
        "/api/auth/google/complete-registration"
    );

    private static final Set<String> CHEMINS_LECTURE_PUBLIQUE = Set.of(
        "/api/public/distributions/prochaines"
    );

    private final Clock clock;
    private final int requetesMaxParMinute;
    private final String methode;
    private final Set<String> chemins;
    private final String code;
    private final String message;
    private final Map<String, Fenetre> fenetres = new ConcurrentHashMap<>();

    private LimiteDebitFilter(Clock clock, int requetesMaxParMinute, String methode, Set<String> chemins,
                              String code, String message) {
        this.clock = clock;
        this.requetesMaxParMinute = requetesMaxParMinute;
        this.methode = methode;
        this.chemins = chemins;
        this.code = code;
        this.message = message;
    }

    public static LimiteDebitFilter authentification(Clock clock, int requetesMaxParMinute) {
        return new LimiteDebitFilter(clock, requetesMaxParMinute, "POST", CHEMINS_AUTH,
            "TOO_MANY_ATTEMPTS", "Trop de tentatives. Reessayez dans une minute.");
    }

    public static LimiteDebitFilter lecturePublique(Clock clock, int requetesMaxParMinute) {
        return new LimiteDebitFilter(clock, requetesMaxParMinute, "GET", CHEMINS_LECTURE_PUBLIQUE,
            "TOO_MANY_REQUESTS", "Trop de requetes. Reessayez dans une minute.");
    }

    private record Fenetre(long debutMillis, int compte) {}

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !methode.equals(request.getMethod()) || !chemins.contains(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        if (!autoriser(request.getRemoteAddr() + "|" + request.getRequestURI())) {
            response.setHeader("Retry-After", String.valueOf(FENETRE.toSeconds()));
            ApiError.ecrire(response, HttpStatus.TOO_MANY_REQUESTS, code, message);
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
