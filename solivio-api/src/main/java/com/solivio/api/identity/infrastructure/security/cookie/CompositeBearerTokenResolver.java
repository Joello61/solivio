package com.solivio.api.identity.infrastructure.security.cookie;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;

/**
 * Resout le Bearer token selon le type de client :
 * - Browser (Next.js) : cookie HttpOnly chiffre (BFF stateless)
 * - Mobile (Capacitor) : header Authorization: Bearer (PKCE natif)
 *
 * Le cookie est prioritaire. Si absent, le header est utilise en fallback.
 * Cette strategie permet de servir les deux types de clients avec le meme backend.
 */
public class CompositeBearerTokenResolver implements BearerTokenResolver {

    private static final Logger log = LoggerFactory.getLogger(CompositeBearerTokenResolver.class);

    private final TokenCookieService cookieService;
    private final DefaultBearerTokenResolver headerResolver;

    public CompositeBearerTokenResolver(TokenCookieService cookieService) {
        this.cookieService = cookieService;
        this.headerResolver = new DefaultBearerTokenResolver();
    }

    @Override
    public String resolve(HttpServletRequest request) {
        // 1. Priorite au cookie : client browser via BFF
        String fromCookie = resolveFromCookie(request);
        if (fromCookie != null) {
            return fromCookie;
        }

        // 2. Fallback header : client mobile Capacitor (PKCE natif)
        return headerResolver.resolve(request);
    }

    private String resolveFromCookie(HttpServletRequest request) {
        return cookieService
            .readCookie(request, TokenCookieService.ACCESS_TOKEN_COOKIE)
            .map(encrypted -> {
                try {
                    return cookieService.decrypt(encrypted);
                } catch (SecurityException e) {
                    log.warn("Cookie access_token altere, requete rejetee: {}",
                        e.getMessage());
                    return null;
                }
            })
            .orElse(null);
    }
}
