package com.solivio.api.identity.infrastructure.security.cookie;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import static org.assertj.core.api.Assertions.assertThat;

class HttpCookieOAuth2AuthorizationRequestRepositoryTest {

    private HttpCookieOAuth2AuthorizationRequestRepository repository;

    @BeforeEach
    void setUp() {
        repository = new HttpCookieOAuth2AuthorizationRequestRepository();
    }

    @Test
    void saveAndLoadAuthorizationRequest() {
        OAuth2AuthorizationRequest authRequest = buildAuthRequest("state-123");
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        repository.saveAuthorizationRequest(authRequest, request, response);

        // Simuler le cookie dans la requete suivante
        String cookieHeader = response.getHeader("Set-Cookie");
        assertThat(cookieHeader).isNotNull().contains(
            HttpCookieOAuth2AuthorizationRequestRepository.COOKIE_NAME);

        String cookieValue = extractCookieValue(cookieHeader);
        request.setCookies(new jakarta.servlet.http.Cookie(
            HttpCookieOAuth2AuthorizationRequestRepository.COOKIE_NAME, cookieValue));

        OAuth2AuthorizationRequest loaded = repository.loadAuthorizationRequest(request);
        assertThat(loaded).isNotNull();
        assertThat(loaded.getState()).isEqualTo("state-123");
    }

    @Test
    void loadReturnsNullWhenNoCookie() {
        MockHttpServletRequest request = new MockHttpServletRequest();

        assertThat(repository.loadAuthorizationRequest(request)).isNull();
    }

    @Test
    void saveNullRequestDeletesCookie() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        repository.saveAuthorizationRequest(null, request, response);

        String cookieHeader = response.getHeader("Set-Cookie");
        assertThat(cookieHeader).contains("Max-Age=0");
    }

    @Test
    void removeAuthorizationRequestDeletesCookieAndReturnsRequest() {
        OAuth2AuthorizationRequest authRequest = buildAuthRequest("state-456");
        MockHttpServletRequest saveRequest = new MockHttpServletRequest();
        MockHttpServletResponse saveResponse = new MockHttpServletResponse();
        repository.saveAuthorizationRequest(authRequest, saveRequest, saveResponse);

        String cookieValue = extractCookieValue(saveResponse.getHeader("Set-Cookie"));
        MockHttpServletRequest loadRequest = new MockHttpServletRequest();
        loadRequest.setCookies(new jakarta.servlet.http.Cookie(
            HttpCookieOAuth2AuthorizationRequestRepository.COOKIE_NAME, cookieValue));
        MockHttpServletResponse removeResponse = new MockHttpServletResponse();

        OAuth2AuthorizationRequest removed =
            repository.removeAuthorizationRequest(loadRequest, removeResponse);

        assertThat(removed).isNotNull();
        assertThat(removed.getState()).isEqualTo("state-456");
        assertThat(removeResponse.getHeader("Set-Cookie")).contains("Max-Age=0");
    }

    @Test
    void cookieIsHttpOnlyWithSameSiteLax() {
        OAuth2AuthorizationRequest authRequest = buildAuthRequest("state-789");
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        repository.saveAuthorizationRequest(authRequest, request, response);

        String cookieHeader = response.getHeader("Set-Cookie");
        assertThat(cookieHeader).contains("HttpOnly");
        assertThat(cookieHeader).contains("SameSite=Lax");
    }

    private OAuth2AuthorizationRequest buildAuthRequest(String state) {
        return OAuth2AuthorizationRequest.authorizationCode()
            .clientId("solivio-backend")
            .authorizationUri("http://localhost:9090/realms/solivio/protocol/openid-connect/auth")
            .redirectUri("http://localhost:8080/login/oauth2/code/keycloak")
            .scope("openid")
            .state(state)
            .build();
    }

    private String extractCookieValue(String setCookieHeader) {
        // Format: "name=value; Max-Age=...; ..."
        String nameValue = setCookieHeader.split(";")[0];
        return nameValue.split("=", 2)[1];
    }
}
