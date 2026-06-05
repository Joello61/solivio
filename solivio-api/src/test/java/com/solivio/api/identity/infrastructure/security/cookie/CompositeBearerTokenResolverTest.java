package com.solivio.api.identity.infrastructure.security.cookie;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class CompositeBearerTokenResolverTest {

    private TokenCookieService cookieService;
    private CompositeBearerTokenResolver resolver;

    @BeforeEach
    void setUp() {
        CookieProperties props = new CookieProperties();
        props.setEncryptionKey("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");
        cookieService = new TokenCookieService(props);
        resolver = new CompositeBearerTokenResolver(cookieService);
    }

    @Test
    void resolvesTokenFromCookieWhenPresent() {
        String token = "jwt.access.token";
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(
            new Cookie(TokenCookieService.ACCESS_TOKEN_COOKIE, cookieService.encrypt(token)));

        assertThat(resolver.resolve(request)).isEqualTo(token);
    }

    @Test
    void fallsBackToAuthorizationHeaderWhenNoCookie() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer header-token");

        assertThat(resolver.resolve(request)).isEqualTo("header-token");
    }

    @Test
    void cookieHasPriorityOverHeader() {
        String cookieToken = "cookie-token";
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(
            new Cookie(TokenCookieService.ACCESS_TOKEN_COOKIE, cookieService.encrypt(cookieToken)));
        request.addHeader("Authorization", "Bearer header-token");

        assertThat(resolver.resolve(request)).isEqualTo(cookieToken);
    }

    @Test
    void returnsNullWhenNoCookieAndNoHeader() {
        MockHttpServletRequest request = new MockHttpServletRequest();

        assertThat(resolver.resolve(request)).isNull();
    }

    @Test
    void returnsNullAndLogsWhenCookieTampered() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(
            new Cookie(TokenCookieService.ACCESS_TOKEN_COOKIE, "tampered-garbage-value"));

        // Cookie altere : pas d'exception propagee, retourne null (requete rejetee par SS)
        assertThat(resolver.resolve(request)).isNull();
    }
}
