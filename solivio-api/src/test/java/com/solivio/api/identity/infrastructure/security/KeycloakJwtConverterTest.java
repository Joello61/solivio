package com.solivio.api.identity.infrastructure.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class KeycloakJwtConverterTest {

    private final KeycloakJwtConverter converter = new KeycloakJwtConverter();

    @Test
    void extractsRealmRolesAsGrantedAuthorities() {
        Jwt jwt = buildJwt(Map.of(
            "realm_access", Map.of("roles", List.of("responsable", "coordinateur"))
        ));

        AbstractAuthenticationToken token = converter.convert(jwt);

        assertThat(token).isNotNull();
        Collection<String> authorities = token.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .toList();
        assertThat(authorities).containsExactlyInAnyOrder("ROLE_responsable", "ROLE_coordinateur");
    }

    @Test
    void returnsEmptyAuthoritiesWhenRealmAccessAbsent() {
        Jwt jwt = buildJwt(Map.of());

        AbstractAuthenticationToken token = converter.convert(jwt);

        assertThat(token).isNotNull();
        assertThat(token.getAuthorities()).isEmpty();
    }

    @Test
    void returnsEmptyAuthoritiesWhenRolesListEmpty() {
        Jwt jwt = buildJwt(Map.of("realm_access", Map.of("roles", List.of())));

        AbstractAuthenticationToken token = converter.convert(jwt);

        assertThat(token.getAuthorities()).isEmpty();
    }

    @Test
    void prefixesEachRoleWithROLE_() {
        Jwt jwt = buildJwt(Map.of(
            "realm_access", Map.of("roles", List.of("benevole"))
        ));

        AbstractAuthenticationToken token = converter.convert(jwt);

        assertThat(token.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .containsExactly("ROLE_benevole");
    }

    private Jwt buildJwt(Map<String, Object> extraClaims) {
        Jwt.Builder builder = Jwt.withTokenValue("test-token")
            .header("alg", "RS256")
            .claim("sub", "user-123")
            .issuedAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(3600));
        extraClaims.forEach(builder::claim);
        return builder.build();
    }
}
