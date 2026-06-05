package com.solivio.api.identity.infrastructure.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.UUID;

/**
 * Representation Spring Security de l'utilisateur authentifie.
 * Porte l'identite (compteId, email) et le contexte tenant actif (tenantSlug, roles).
 * Sera complete en Phase 3 avec la construction depuis le JWT custom.
 */
public class SolivioUserDetails implements UserDetails {

    private final UUID compteId;
    private final String email;
    private final String password;
    private final String tenantSlug;
    private final boolean superAdmin;
    private final Collection<? extends GrantedAuthority> authorities;
    private final boolean enabled;

    public SolivioUserDetails(
            UUID compteId,
            String email,
            String password,
            String tenantSlug,
            boolean superAdmin,
            Collection<? extends GrantedAuthority> authorities,
            boolean enabled) {
        this.compteId = compteId;
        this.email = email;
        this.password = password;
        this.tenantSlug = tenantSlug;
        this.superAdmin = superAdmin;
        this.authorities = authorities;
        this.enabled = enabled;
    }

    public UUID getCompteId() {
        return compteId;
    }

    public String getTenantSlug() {
        return tenantSlug;
    }

    public boolean isSuperAdmin() {
        return superAdmin;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
