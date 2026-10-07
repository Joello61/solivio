package com.solivio.api.identity;

import lombok.Getter;
import org.jspecify.annotations.NullMarked;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.UUID;

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
