package com.solivio.api.identity.infrastructure.security.cookie;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2RefreshToken;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TokenCookieAuthenticationSuccessHandlerTest {

    @Mock
    private OAuth2AuthorizedClientService authorizedClientService;

    @Mock
    private OAuth2AuthorizedClient authorizedClient;

    private TokenCookieService cookieService;
    private HttpCookieOAuth2AuthorizationRequestRepository authRequestRepo;
    private TokenCookieAuthenticationSuccessHandler handler;

    @BeforeEach
    void setUp() {
        CookieProperties props = new CookieProperties();
        props.setEncryptionKey("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");
        cookieService = new TokenCookieService(props);
        authRequestRepo = new HttpCookieOAuth2AuthorizationRequestRepository();
        handler = new TokenCookieAuthenticationSuccessHandler(
            cookieService, authorizedClientService, authRequestRepo, "http://localhost:3000");
    }

    @Test
    void writesAllThreeCookiesOnSuccess() throws Exception {
        OAuth2AccessToken accessToken = new OAuth2AccessToken(
            OAuth2AccessToken.TokenType.BEARER, "access-jwt-value",
            Instant.now(), Instant.now().plusSeconds(300));
        OAuth2RefreshToken refreshToken = new OAuth2RefreshToken(
            "refresh-token-value", Instant.now(), Instant.now().plusSeconds(1800));

        when(authorizedClient.getAccessToken()).thenReturn(accessToken);
        when(authorizedClient.getRefreshToken()).thenReturn(refreshToken);
        when(authorizedClientService.loadAuthorizedClient(any(), any()))
            .thenReturn(authorizedClient);

        OAuth2AuthenticationToken auth = buildOidcAuthToken();
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        handler.onAuthenticationSuccess(request, response, auth);

        String cookies = String.join("|", response.getHeaders("Set-Cookie"));
        assertThat(cookies).contains(TokenCookieService.ACCESS_TOKEN_COOKIE);
        assertThat(cookies).contains(TokenCookieService.REFRESH_TOKEN_COOKIE);
        assertThat(cookies).contains(TokenCookieService.ID_TOKEN_COOKIE);
        assertThat(cookies).contains("HttpOnly");
        assertThat(response.getRedirectedUrl()).isEqualTo("http://localhost:3000");
    }

    @Test
    void skipsIdTokenCookieWhenPrincipalIsNotOidcUser() throws Exception {
        OAuth2AccessToken accessToken = new OAuth2AccessToken(
            OAuth2AccessToken.TokenType.BEARER, "access-only",
            Instant.now(), Instant.now().plusSeconds(300));

        when(authorizedClient.getAccessToken()).thenReturn(accessToken);
        when(authorizedClient.getRefreshToken()).thenReturn(null);
        when(authorizedClientService.loadAuthorizedClient(any(), any()))
            .thenReturn(authorizedClient);

        OAuth2User plainUser = new DefaultOAuth2User(List.of(), Map.of("sub", "user-123"), "sub");
        OAuth2AuthenticationToken auth = new OAuth2AuthenticationToken(plainUser, List.of(), "keycloak");

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        handler.onAuthenticationSuccess(request, response, auth);

        String cookies = String.join("|", response.getHeaders("Set-Cookie"));
        assertThat(cookies).contains(TokenCookieService.ACCESS_TOKEN_COOKIE);
        assertThat(cookies).doesNotContain(TokenCookieService.REFRESH_TOKEN_COOKIE);
        assertThat(cookies).doesNotContain(TokenCookieService.ID_TOKEN_COOKIE);
    }

    private OAuth2AuthenticationToken buildOidcAuthToken() {
        OidcIdToken idToken = OidcIdToken.withTokenValue("id-token-value")
            .subject("user-123")
            .issuedAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(36000))
            .build();
        OidcUser oidcUser = new DefaultOidcUser(List.of(), idToken);
        return new OAuth2AuthenticationToken(oidcUser, List.of(), "keycloak");
    }
}
