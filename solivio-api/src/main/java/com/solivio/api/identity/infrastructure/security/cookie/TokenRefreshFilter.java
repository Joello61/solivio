package com.solivio.api.identity.infrastructure.security.cookie;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.oauth2.client.OAuth2AuthorizeRequest;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2RefreshToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;

/**
 * Verifie si l'access token expire bientot (moins de 30s de validite).
 * Si oui, utilise le refresh token pour obtenir un nouveau token et
 * met a jour les cookies. S'execute avant la validation JWT du resource server.
 */
public class TokenRefreshFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(TokenRefreshFilter.class);
    private static final String REGISTRATION_ID = "keycloak";
    private static final int REFRESH_THRESHOLD_SECONDS = 30;

    private final TokenCookieService cookieService;
    private final OAuth2AuthorizedClientManager clientManager;
    private final ClientRegistrationRepository clientRegistrationRepository;
    private final JwtDecoder jwtDecoder;

    public TokenRefreshFilter(
            TokenCookieService cookieService,
            OAuth2AuthorizedClientManager clientManager,
            ClientRegistrationRepository clientRegistrationRepository,
            JwtDecoder jwtDecoder) {
        this.cookieService = cookieService;
        this.clientManager = clientManager;
        this.clientRegistrationRepository = clientRegistrationRepository;
        this.jwtDecoder = jwtDecoder;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain chain) throws ServletException, IOException {

        cookieService.readCookie(request, TokenCookieService.ACCESS_TOKEN_COOKIE)
            .ifPresent(encryptedAccess -> {
                try {
                    String accessToken = cookieService.decrypt(encryptedAccess);
                    if (isExpiringSoon(accessToken)) {
                        tryRefresh(request, response, accessToken);
                    }
                } catch (SecurityException e) {
                    // Cookie altere : on laisse passer, le resource server rejettera la requete
                    log.debug("Cookie access_token invalide, pas de refresh tente");
                }
            });

        chain.doFilter(request, response);
    }

    private boolean isExpiringSoon(String tokenValue) {
        try {
            Jwt jwt = jwtDecoder.decode(tokenValue);
            Instant expiresAt = jwt.getExpiresAt();
            if (expiresAt == null) {
                return false;
            }
            return Instant.now().isAfter(expiresAt.minusSeconds(REFRESH_THRESHOLD_SECONDS));
        } catch (JwtException e) {
            // Token invalide ou expire : le refresh ne servira probablement pas
            // mais on tente quand meme si un refresh token est disponible
            return true;
        }
    }

    private void tryRefresh(HttpServletRequest request, HttpServletResponse response,
                            String currentAccessToken) {
        cookieService.readCookie(request, TokenCookieService.REFRESH_TOKEN_COOKIE)
            .ifPresent(encryptedRefresh -> {
                try {
                    String refreshToken = cookieService.decrypt(encryptedRefresh);
                    ClientRegistration registration =
                        clientRegistrationRepository.findByRegistrationId(REGISTRATION_ID);
                    if (registration == null) {
                        return;
                    }

                    OAuth2AuthorizedClient client = buildClientForRefresh(
                        registration, currentAccessToken, refreshToken);

                    OAuth2AuthorizeRequest authorizeRequest = OAuth2AuthorizeRequest
                        .withAuthorizedClient(client)
                        .principal("refresh")
                        .attributes(attrs -> {
                            attrs.put(HttpServletRequest.class.getName(), request);
                            attrs.put(HttpServletResponse.class.getName(), response);
                        })
                        .build();

                    OAuth2AuthorizedClient refreshed = clientManager.authorize(authorizeRequest);
                    if (refreshed != null && refreshed.getAccessToken() != null) {
                        int accessTtl = computeTtl(
                            refreshed.getAccessToken().getExpiresAt(), 300);
                        cookieService.writeAccessTokenCookie(
                            response, refreshed.getAccessToken().getTokenValue(), accessTtl);

                        if (refreshed.getRefreshToken() != null) {
                            int refreshTtl = computeTtl(
                                refreshed.getRefreshToken().getExpiresAt(), 1800);
                            cookieService.writeRefreshTokenCookie(
                                response, refreshed.getRefreshToken().getTokenValue(), refreshTtl);
                        }
                        log.debug("Access token rafraichi avec succes");
                    }
                } catch (SecurityException e) {
                    log.debug("Refresh token invalide, pas de renouvellement");
                }
            });
    }

    private OAuth2AuthorizedClient buildClientForRefresh(
            ClientRegistration registration, String accessToken, String refreshToken) {
        return new OAuth2AuthorizedClient(
            registration,
            "refresh",
            new OAuth2AccessToken(
                OAuth2AccessToken.TokenType.BEARER,
                accessToken,
                Instant.now().minusSeconds(1),
                Instant.now()
            ),
            new OAuth2RefreshToken(refreshToken, Instant.now().minusSeconds(1))
        );
    }

    private int computeTtl(Instant expiresAt, int fallback) {
        if (expiresAt == null) {
            return fallback;
        }
        long seconds = expiresAt.getEpochSecond() - Instant.now().getEpochSecond();
        return seconds > 0 ? (int) seconds : fallback;
    }
}
