package com.solivio.api.identity.infrastructure.security;

import com.solivio.api.association.multitenancy.TenantContext;
import com.solivio.api.identity.domain.Personne;
import com.solivio.api.identity.infrastructure.persistence.PersonneRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Cree un enregistrement Personne au premier appel authentifie si celui-ci
 * n'existe pas encore. Transparent pour l'utilisateur.
 * S'execute uniquement quand le TenantContext est alimente (schema tenant present).
 */
@Component
public class JitProvisioningFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JitProvisioningFilter.class);

    private final PersonneRepository personneRepository;

    public JitProvisioningFilter(PersonneRepository personneRepository) {
        this.personneRepository = personneRepository;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        provisionIfAbsent();
        filterChain.doFilter(request, response);
    }

    private void provisionIfAbsent() {
        // Pas de schema tenant actif : utilisateur sans association_id (ex. premier login Google).
        // Le provisioning sera fait apres qu'un responsable lui attribue une association.
        if (TenantContext.getTenantId() == null) {
            return;
        }

        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (!(auth instanceof JwtAuthenticationToken jwtToken)) {
            return;
        }

        Jwt jwt = jwtToken.getToken();
        String keycloakId = jwt.getSubject();
        if (keycloakId == null) {
            return;
        }

        if (!personneRepository.existsByKeycloakId(keycloakId)) {
            Personne personne = new Personne(
                keycloakId,
                jwt.getClaimAsString("family_name") != null
                    ? jwt.getClaimAsString("family_name") : "",
                jwt.getClaimAsString("given_name") != null
                    ? jwt.getClaimAsString("given_name") : "",
                jwt.getClaimAsString("email") != null
                    ? jwt.getClaimAsString("email") : keycloakId + "@provisioned"
            );
            personneRepository.save(personne);
            log.info("JIT provisioning: Personne created for keycloakId={}", keycloakId);
        }
    }
}
