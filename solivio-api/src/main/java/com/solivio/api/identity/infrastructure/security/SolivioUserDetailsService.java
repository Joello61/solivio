package com.solivio.api.identity.infrastructure.security;

import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import org.jspecify.annotations.NullMarked;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Charge un Compte depuis public.compte par email.
 * Utilise par Spring Security pour le form login et l'authentification basic.
 * L'authentification principale passe par le JwtAuthenticationFilter.
 */
@Service
public class SolivioUserDetailsService implements UserDetailsService {

    private final CompteRepository compteRepository;

    public SolivioUserDetailsService(CompteRepository compteRepository) {
        this.compteRepository = compteRepository;
    }

    @Override
    @NullMarked
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Compte compte = compteRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("Compte introuvable : " + email));

        return new SolivioUserDetails(
            compte.getId(),
            compte.getEmail(),
            compte.getPasswordHash(),
            compte.isSuperAdmin(),
            List.of(new SimpleGrantedAuthority("ROLE_USER")),
            compte.isActif() && compte.isEmailVerifie()
        );
    }
}
