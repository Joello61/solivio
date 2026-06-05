package com.solivio.api.identity.infrastructure.security.cookie;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TokenCookieServiceTest {

    private TokenCookieService service;

    @BeforeEach
    void setUp() {
        CookieProperties props = new CookieProperties();
        // Cle de test : 32 octets en base64 (44 chars avec padding)
        props.setEncryptionKey("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");
        service = new TokenCookieService(props);
    }

    @Test
    void encryptAndDecryptRoundtrip() {
        String original = "eyJhbGciOiJSUzI1NiJ9.test-token-value";
        String encrypted = service.encrypt(original);

        assertThat(encrypted).isNotEqualTo(original);
        assertThat(service.decrypt(encrypted)).isEqualTo(original);
    }

    @Test
    void encryptProducesDifferentOutputEachTime() {
        String token = "same-token";
        String enc1 = service.encrypt(token);
        String enc2 = service.encrypt(token);

        // L'IV aleatoire garantit que le meme plaintext donne des chiffres differents
        assertThat(enc1).isNotEqualTo(enc2);
        assertThat(service.decrypt(enc1)).isEqualTo(token);
        assertThat(service.decrypt(enc2)).isEqualTo(token);
    }

    @Test
    void decryptTamperedCookieThrowsSecurityException() {
        String encrypted = service.encrypt("valid-token");
        String tampered = encrypted.substring(0, encrypted.length() - 4) + "XXXX";

        assertThatThrownBy(() -> service.decrypt(tampered))
            .isInstanceOf(SecurityException.class)
            .hasMessageContaining("altere");
    }

    @Test
    void readCookieReturnsEmptyWhenNoCookies() {
        MockHttpServletRequest request = new MockHttpServletRequest();

        assertThat(service.readCookie(request, TokenCookieService.ACCESS_TOKEN_COOKIE))
            .isEmpty();
    }

    @Test
    void readCookieReturnsCookieValue() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie(TokenCookieService.ACCESS_TOKEN_COOKIE, "some-value"));

        assertThat(service.readCookie(request, TokenCookieService.ACCESS_TOKEN_COOKIE))
            .contains("some-value");
    }

    @Test
    void writeAccessTokenCookieSetsHttpOnlyHeader() {
        MockHttpServletResponse response = new MockHttpServletResponse();
        service.writeAccessTokenCookie(response, "my-token", 300);

        String header = response.getHeader("Set-Cookie");
        assertThat(header).contains(TokenCookieService.ACCESS_TOKEN_COOKIE);
        assertThat(header).contains("HttpOnly");
        assertThat(header).contains("SameSite=Strict");
        assertThat(header).contains("Max-Age=300");
    }

    @Test
    void writeIdTokenCookieSetsHttpOnlyHeader() {
        MockHttpServletResponse response = new MockHttpServletResponse();
        service.writeIdTokenCookie(response, "id-token-value", 36000);

        String header = response.getHeader("Set-Cookie");
        assertThat(header).contains(TokenCookieService.ID_TOKEN_COOKIE);
        assertThat(header).contains("HttpOnly");
        assertThat(header).contains("Max-Age=36000");
    }

    @Test
    void deleteTokenCookiesDeletesAllThreeCookies() {
        MockHttpServletResponse response = new MockHttpServletResponse();
        service.deleteTokenCookies(response);

        String headers = String.join("|", response.getHeaders("Set-Cookie"));
        assertThat(headers).contains(TokenCookieService.ACCESS_TOKEN_COOKIE);
        assertThat(headers).contains(TokenCookieService.REFRESH_TOKEN_COOKIE);
        assertThat(headers).contains(TokenCookieService.ID_TOKEN_COOKIE);
        assertThat(headers).contains("Max-Age=0");
    }
}
