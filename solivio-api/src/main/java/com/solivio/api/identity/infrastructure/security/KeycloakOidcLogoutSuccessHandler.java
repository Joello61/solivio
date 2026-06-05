package com.solivio.api.identity.infrastructure.security;

import com.solivio.api.identity.infrastructure.security.cookie.TokenCookieService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Redirige vers le endpoint de deconnexion Keycloak (OIDC RP-Initiated Logout).
 * Inclut le id_token_hint depuis le cookie pour que Keycloak invalide
 * la session SSO sans afficher de page de confirmation.
 */
public class KeycloakOidcLogoutSuccessHandler implements LogoutSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(KeycloakOidcLogoutSuccessHandler.class);

    private final TokenCookieService cookieService;
    private final String endSessionEndpoint;
    private final String postLogoutRedirectUri;

    public KeycloakOidcLogoutSuccessHandler(
            TokenCookieService cookieService,
            String issuerUri,
            String postLogoutRedirectUri) {
        this.cookieService = cookieService;
        this.endSessionEndpoint = issuerUri + "/protocol/openid-connect/logout";
        this.postLogoutRedirectUri = postLogoutRedirectUri;
    }

    @Override
    public void onLogoutSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException {
        StringBuilder url = new StringBuilder(endSessionEndpoint);
        url.append("?post_logout_redirect_uri=")
            .append(URLEncoder.encode(postLogoutRedirectUri, StandardCharsets.UTF_8));

        cookieService.readCookie(request, TokenCookieService.ID_TOKEN_COOKIE)
            .ifPresent(encrypted -> {
                try {
                    String idToken = cookieService.decrypt(encrypted);
                    url.append("&id_token_hint=")
                        .append(URLEncoder.encode(idToken, StandardCharsets.UTF_8));
                } catch (SecurityException e) {
                    log.debug("Cookie id_token invalide lors du logout, deconnexion sans hint");
                }
            });

        log.info("Deconnexion OIDC, redirection vers Keycloak end_session");
        response.sendRedirect(url.toString());
    }
}
