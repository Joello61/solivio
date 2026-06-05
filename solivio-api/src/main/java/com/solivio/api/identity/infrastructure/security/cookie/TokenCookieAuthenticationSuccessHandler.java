package com.solivio.api.identity.infrastructure.security.cookie;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;

import java.io.IOException;
import java.time.Instant;

/**
 * Apres un login Keycloak reussi, chiffre l'access token et le refresh token
 * dans des cookies HttpOnly. Aucune session n'est creee.
 *
 * Les durees de vie des cookies suivent celles des tokens Keycloak.
 */
public class TokenCookieAuthenticationSuccessHandler
        extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger log =
        LoggerFactory.getLogger(TokenCookieAuthenticationSuccessHandler.class);

    private static final int FALLBACK_ACCESS_TTL_SECONDS = 300;
    private static final int FALLBACK_REFRESH_TTL_SECONDS = 1800;

    private final TokenCookieService cookieService;
    private final OAuth2AuthorizedClientService authorizedClientService;
    private final HttpCookieOAuth2AuthorizationRequestRepository authRequestRepo;

    public TokenCookieAuthenticationSuccessHandler(
            TokenCookieService cookieService,
            OAuth2AuthorizedClientService authorizedClientService,
            HttpCookieOAuth2AuthorizationRequestRepository authRequestRepo,
            String postLoginRedirectUri) {
        this.cookieService = cookieService;
        this.authorizedClientService = authorizedClientService;
        this.authRequestRepo = authRequestRepo;
        setDefaultTargetUrl(postLoginRedirectUri);
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
            OAuth2AuthorizedClient client = authorizedClientService.loadAuthorizedClient(
                oauthToken.getAuthorizedClientRegistrationId(),
                oauthToken.getName());

            if (client != null) {
                writeAccessTokenCookie(response, client);
                writeRefreshTokenCookie(response, client);
                writeIdTokenCookie(response, oauthToken);
                log.info("Cookies de session ecrits pour: {}",
                    oauthToken.getName());
            }
        }

        // Nettoyer le cookie d'etat du flow OAuth2
        authRequestRepo.removeAuthorizationRequest(request, response);
        clearAuthenticationAttributes(request);
        response.sendRedirect(getDefaultTargetUrl());
    }

    private void writeAccessTokenCookie(HttpServletResponse response,
                                        OAuth2AuthorizedClient client) {
        String token = client.getAccessToken().getTokenValue();
        int maxAge = computeMaxAge(
            client.getAccessToken().getExpiresAt(),
            FALLBACK_ACCESS_TTL_SECONDS);
        cookieService.writeAccessTokenCookie(response, token, maxAge);
    }

    private void writeRefreshTokenCookie(HttpServletResponse response,
                                         OAuth2AuthorizedClient client) {
        if (client.getRefreshToken() == null) {
            return;
        }
        String token = client.getRefreshToken().getTokenValue();
        int maxAge = computeMaxAge(
            client.getRefreshToken().getExpiresAt(),
            FALLBACK_REFRESH_TTL_SECONDS);
        cookieService.writeRefreshTokenCookie(response, token, maxAge);
    }

    private void writeIdTokenCookie(HttpServletResponse response,
                                    OAuth2AuthenticationToken oauthToken) {
        if (!(oauthToken.getPrincipal() instanceof OidcUser oidcUser)) {
            return;
        }
        String idToken = oidcUser.getIdToken().getTokenValue();
        // Le cookie id_token vit le temps de la session SSO (fallback : 10h).
        int maxAge = computeMaxAge(oidcUser.getIdToken().getExpiresAt(), 36000);
        cookieService.writeIdTokenCookie(response, idToken, maxAge);
    }

    private int computeMaxAge(Instant expiresAt, int fallback) {
        if (expiresAt == null) {
            return fallback;
        }
        long seconds = expiresAt.getEpochSecond() - Instant.now().getEpochSecond();
        return seconds > 0 ? (int) seconds : fallback;
    }
}
