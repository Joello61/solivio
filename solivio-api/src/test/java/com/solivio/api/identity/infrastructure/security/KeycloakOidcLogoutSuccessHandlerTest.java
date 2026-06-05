package com.solivio.api.identity.infrastructure.security;

import com.solivio.api.identity.infrastructure.security.cookie.CookieProperties;
import com.solivio.api.identity.infrastructure.security.cookie.TokenCookieService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class KeycloakOidcLogoutSuccessHandlerTest {

    private static final String ISSUER_URI = "http://localhost:9090/realms/solivio";
    private static final String POST_LOGOUT_URI = "http://localhost:3000";

    private TokenCookieService cookieService;
    private KeycloakOidcLogoutSuccessHandler handler;

    @BeforeEach
    void setUp() {
        CookieProperties props = new CookieProperties();
        props.setEncryptionKey("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");
        cookieService = new TokenCookieService(props);
        handler = new KeycloakOidcLogoutSuccessHandler(cookieService, ISSUER_URI, POST_LOGOUT_URI);
    }

    @Test
    void redirectsToKeycloakEndSessionWithPostLogoutUri() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        handler.onLogoutSuccess(request, response, null);

        String location = response.getRedirectedUrl();
        assertThat(location).startsWith(ISSUER_URI + "/protocol/openid-connect/logout");
        assertThat(location).contains("post_logout_redirect_uri=");
        assertThat(location).contains("localhost%3A3000");
    }

    @Test
    void includesIdTokenHintWhenCookiePresent() throws Exception {
        String encryptedIdToken = cookieService.encrypt("raw-id-token-value");

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie(TokenCookieService.ID_TOKEN_COOKIE, encryptedIdToken));
        MockHttpServletResponse response = new MockHttpServletResponse();

        handler.onLogoutSuccess(request, response, null);

        String location = response.getRedirectedUrl();
        assertThat(location).contains("id_token_hint=");
        assertThat(location).contains("raw-id-token-value");
    }

    @Test
    void proceedsWithoutIdTokenHintWhenCookieAbsent() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        handler.onLogoutSuccess(request, response, null);

        String location = response.getRedirectedUrl();
        assertThat(location).doesNotContain("id_token_hint");
    }

    @Test
    void proceedsWithoutIdTokenHintWhenCookieAltere() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie(TokenCookieService.ID_TOKEN_COOKIE, "cookie-invalide-XXX"));
        MockHttpServletResponse response = new MockHttpServletResponse();

        handler.onLogoutSuccess(request, response, null);

        String location = response.getRedirectedUrl();
        assertThat(location).startsWith(ISSUER_URI + "/protocol/openid-connect/logout");
        assertThat(location).doesNotContain("id_token_hint");
    }
}
