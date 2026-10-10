package com.solivio.api.identity;

import lombok.Getter;
import org.jspecify.annotations.NullMarked;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Arrays;
import java.util.Collection;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Representation Spring Security de l'utilisateur authentifie. API publique du
 * module identity : les controleurs des autres modules l'injectent.
 * Porte l'identite (compteId, email) et les roles issus du JWT.
 */
public class SolivioUserDetails implements UserDetails {

    @Getter
    private final UUID compteId;
    private final String email;
    private final String password;
    @Getter
    private final boolean superAdmin;
    private final Collection<? extends GrantedAuthority> authorities;
    private final boolean enabled;

    public SolivioUserDetails(
            UUID compteId,
            String email,
            String password,
            boolean superAdmin,
            Collection<? extends GrantedAuthority> authorities,
            boolean enabled) {
        this.compteId = compteId;
        this.email = email;
        this.password = password;
        this.superAdmin = superAdmin;
        this.authorities = authorities;
        this.enabled = enabled;
    }

    @Override
    @NullMarked
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    /** Vrai si l'utilisateur porte au moins un des roles donnes (en minuscules, sans prefixe). */
    public boolean aUnDesRoles(String... roles) {
        Set<String> attendues = Arrays.stream(roles)
            .map(r -> "ROLE_" + r.toUpperCase(Locale.ROOT))
            .collect(Collectors.toSet());
        return authorities.stream().anyMatch(a -> attendues.contains(a.getAuthority()));
    }

    /** Roles metier de l'utilisateur, en minuscules et sans prefixe. */
    public Set<String> roles() {
        return authorities.stream()
            .map(GrantedAuthority::getAuthority)
            .filter(Objects::nonNull)
            .map(a -> a.replaceFirst("^ROLE_", "").toLowerCase(Locale.ROOT))
            .collect(Collectors.toSet());
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    @NullMarked
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
