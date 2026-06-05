package com.solivio.api.identity.infrastructure.security.cookie;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.util.SerializationUtils;

import java.util.Arrays;
import java.util.Base64;
import java.util.Optional;

/**
 * Stocke l'etat du flow OAuth2 Authorization Code dans un cookie HttpOnly
 * au lieu de la session HTTP, ce qui permet un backend sans etat (stateless).
 *
 * SameSite=Lax est obligatoire (pas Strict) : Keycloak redirige depuis
 * un domaine different, et le navigateur doit envoyer ce cookie sur ce retour.
 */
public class HttpCookieOAuth2AuthorizationRequestRepository
        implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    static final String COOKIE_NAME = "oauth2_auth_request";
    private static final int COOKIE_MAX_AGE_SECONDS = 180;

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        return findCookie(request)
            .map(value -> deserialize(value))
            .orElse(null);
    }

    @Override
    public void saveAuthorizationRequest(
            OAuth2AuthorizationRequest authRequest,
            HttpServletRequest request,
            HttpServletResponse response) {
        if (authRequest == null) {
            deleteCookie(response);
            return;
        }
        String cookieHeader = COOKIE_NAME + "=" + serialize(authRequest)
            + "; Max-Age=" + COOKIE_MAX_AGE_SECONDS
            + "; Path=/"
            + "; HttpOnly"
            + "; SameSite=Lax";
        response.addHeader("Set-Cookie", cookieHeader);
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(
            HttpServletRequest request,
            HttpServletResponse response) {
        OAuth2AuthorizationRequest req = loadAuthorizationRequest(request);
        deleteCookie(response);
        return req;
    }

    private Optional<String> findCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }
        return Arrays.stream(request.getCookies())
            .filter(c -> COOKIE_NAME.equals(c.getName()))
            .map(c -> c.getValue())
            .findFirst();
    }

    private void deleteCookie(HttpServletResponse response) {
        response.addHeader("Set-Cookie",
            COOKIE_NAME + "=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax");
    }

    private String serialize(OAuth2AuthorizationRequest request) {
        return Base64.getUrlEncoder().withoutPadding()
            .encodeToString(SerializationUtils.serialize(request));
    }

    @SuppressWarnings("deprecation")
    private OAuth2AuthorizationRequest deserialize(String value) {
        return (OAuth2AuthorizationRequest) SerializationUtils.deserialize(
            Base64.getUrlDecoder().decode(value));
    }
}
