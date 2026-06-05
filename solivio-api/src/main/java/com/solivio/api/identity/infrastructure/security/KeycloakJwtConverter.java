package com.solivio.api.identity.infrastructure.security;

import org.jspecify.annotations.NonNull;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

/**
 * Extrait les roles Keycloak depuis le claim "realm_access.roles" du JWT
 * et les convertit en GrantedAuthority avec le prefixe "ROLE_".
 * Construit directement un JwtAuthenticationToken pour eviter l'ajout
 * automatique de FACTOR_BEARER par JwtAuthenticationConverter.
 */
@Component
public class KeycloakJwtConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    public AbstractAuthenticationToken convert(@NonNull Jwt jwt) {
        return new JwtAuthenticationToken(jwt, extractRealmRoles(jwt));
    }

    @SuppressWarnings("unchecked")
    private Collection<GrantedAuthority> extractRealmRoles(Jwt jwt) {
        Map<String, Object> realmAccess =
            (Map<String, Object>) jwt.getClaims().getOrDefault("realm_access", Collections.emptyMap());
        Collection<String> roles =
            (Collection<String>) realmAccess.getOrDefault("roles", Collections.emptyList());
        return roles.stream()
            .map(role -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + role))
            .toList();
    }
}