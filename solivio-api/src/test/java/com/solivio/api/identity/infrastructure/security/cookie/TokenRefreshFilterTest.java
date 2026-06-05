package com.solivio.api.identity.infrastructure.security.cookie;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TokenRefreshFilterTest {

    @Mock
    private OAuth2AuthorizedClientManager clientManager;

    @Mock
    private ClientRegistrationRepository clientRegistrationRepository;

    @Mock
    private JwtDecoder jwtDecoder;

    private TokenCookieService cookieService;
    private TokenRefreshFilter filter;

    @BeforeEach
    void setUp() {
        CookieProperties props = new CookieProperties();
        props.setEncryptionKey("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");
        cookieService = new TokenCookieService(props);
        filter = new TokenRefreshFilter(
            cookieService, clientManager, clientRegistrationRepository, jwtDecoder);
    }

    @Test
    void continuesChainWhenNoCookiePresent() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        verify(clientManager, never()).authorize(any());
    }

    @Test
    void continuesChainWhenTokenNotExpiringSoon() throws Exception {
        String tokenValue = "valid.jwt.token";
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie(
            TokenCookieService.ACCESS_TOKEN_COOKIE, cookieService.encrypt(tokenValue)));
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        // Token expire dans 5 minutes : pas besoin de refresh
        Jwt jwt = mock(Jwt.class);
        when(jwt.getExpiresAt()).thenReturn(Instant.now().plusSeconds(300));
        when(jwtDecoder.decode(tokenValue)).thenReturn(jwt);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        verify(clientManager, never()).authorize(any());
    }

    @Test
    void attemptsRefreshWhenTokenExpired() throws Exception {
        String tokenValue = "expired.jwt.token";
        String refreshValue = "refresh.token";
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(
            new Cookie(TokenCookieService.ACCESS_TOKEN_COOKIE,
                cookieService.encrypt(tokenValue)),
            new Cookie(TokenCookieService.REFRESH_TOKEN_COOKIE,
                cookieService.encrypt(refreshValue)));
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        // Token invalide/expire : JwtDecoder leve une exception
        when(jwtDecoder.decode(tokenValue)).thenThrow(new JwtException("expired"));
        // Aucun client registration disponible : refresh echoue silencieusement
        when(clientRegistrationRepository.findByRegistrationId("keycloak")).thenReturn(null);

        filter.doFilter(request, response, chain);

        // La chaine continue toujours meme si le refresh echoue
        verify(chain).doFilter(request, response);
    }

    @Test
    void continuesChainWhenCookieTampered() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(
            new Cookie(TokenCookieService.ACCESS_TOKEN_COOKIE, "tampered-garbage"));
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        // Pas d'exception propagee, la chaine continue
        verify(chain).doFilter(request, response);
        verify(clientManager, never()).authorize(any());
    }
}
