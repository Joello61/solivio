package com.solivio.api.identity.infrastructure.security;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String SECRET = "test-jwt-secret-key-must-be-at-least-32-bytes-long!";
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, 15, 30);
    }

    @Test
    void genererAccessToken_retourneTokenValide() {
        UUID compteId = UUID.randomUUID();
        String token = jwtService.genererAccessToken(
            compteId, "alice@example.com", "Dupont", "Alice", List.of("beneficiaire"), null, false);

        assertThat(token).isNotBlank();
        assertThat(jwtService.estValide(token)).isTrue();
    }

    @Test
    void valider_retourneClaimsCorrects() {
        UUID compteId = UUID.randomUUID();
        String token = jwtService.genererAccessToken(
            compteId, "alice@example.com", "Dupont", "Alice", List.of("coordinateur"), "coordo_sec", false);

        Claims claims = jwtService.valider(token);

        assertThat(claims.getSubject()).isEqualTo(compteId.toString());
        assertThat(claims.get("email", String.class)).isEqualTo("alice@example.com");
        assertThat(claims.get("tenant")).isNull();
        assertThat(claims.get("coordo_type", String.class)).isEqualTo("coordo_sec");
    }

    @Test
    void estValide_retourneFalseTokenExpire() {
        JwtService shortLivedService = new JwtService(SECRET, 0, 30);
        UUID compteId = UUID.randomUUID();
        String token = shortLivedService.genererAccessToken(
            compteId, "bob@example.com", "Martin", "Bob", List.of("benevole"), null, false);

        // Le token expire immediatement (0 minutes)
        assertThat(shortLivedService.estValide(token)).isFalse();
    }

    @Test
    void estValide_retourneFalseTokenFalsifie() {
        UUID compteId = UUID.randomUUID();
        String token = jwtService.genererAccessToken(
            compteId, "eve@example.com", "Evil", "Eve", List.of("admin"), null, false);

        String tokenFalsifie = token + "tampered";
        assertThat(jwtService.estValide(tokenFalsifie)).isFalse();
    }

    @Test
    void hasher_retourneHashDifferentDuTokenBrut() {
        String tokenBrut = jwtService.genererRefreshTokenBrut();
        String hash = jwtService.hasher(tokenBrut);

        assertThat(hash).isNotEqualTo(tokenBrut);
        assertThat(hash).hasSize(43); // SHA-256 en base64url sans padding = 43 chars
    }

    @Test
    void hasher_memeEntreeMemeSortie() {
        String tokenBrut = "test-token-value";
        assertThat(jwtService.hasher(tokenBrut)).isEqualTo(jwtService.hasher(tokenBrut));
    }

    @Test
    void tokenSuperAdmin_portLeDrapeau() {
        UUID compteId = UUID.randomUUID();
        String token = jwtService.genererAccessToken(
            compteId, "admin@solivio.app", "Admin", "Super", List.of(), null, true);

        Claims claims = jwtService.valider(token);
        assertThat(claims.get("super_admin", Boolean.class)).isTrue();
        assertThat(claims.get(String.class)).isNull();
    }

    @Test
    void constructeur_refuseSecretAbsent() {
        assertThatThrownBy(() -> new JwtService("", 15, 30))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("SOLIVIO_AUTH_JWT_SECRET");
        assertThatThrownBy(() -> new JwtService(null, 15, 30))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void constructeur_refuseSecretTropCourt() {
        assertThatThrownBy(() -> new JwtService("trop-court", 15, 30))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32 octets");
    }
}
