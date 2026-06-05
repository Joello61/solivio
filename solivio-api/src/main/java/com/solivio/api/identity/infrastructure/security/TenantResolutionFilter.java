package com.solivio.api.identity.infrastructure.security;

import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.association.multitenancy.TenantContext;
import com.solivio.api.association.multitenancy.TenantProvisioningService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Alimente le TenantContext depuis le claim "tenant" du JWT apres l'authentification.
 * Doit etre enregistre dans la SecurityFilterChain (apres JwtAuthenticationFilter)
 * pour avoir acces au SecurityContext peuple. Ne pas mettre @Component : le bean est
 * declare dans SecurityConfig avec FilterRegistrationBean pour eviter la double
 * registration servlet.
 */
public class TenantResolutionFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(TenantResolutionFilter.class);

    private final AssociationRepository associationRepository;

    public TenantResolutionFilter(AssociationRepository associationRepository) {
        this.associationRepository = associationRepository;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        try {
            resolveAndSetTenant();
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private void resolveAndSetTenant() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return;
        }

        // En Phase 3 : lire le tenantSlug depuis SolivioUserDetails (principal du JWT custom).
        // Pour l'instant le filtre ne fait rien - les endpoints publics /api/auth/** ne
        // necessitent pas de tenant.
        if (auth.getPrincipal() instanceof SolivioUserDetails userDetails) {
            String tenantSlug = userDetails.getTenantSlug();
            if (tenantSlug == null || tenantSlug.isBlank()) {
                return;
            }
            associationRepository.findBySlug(tenantSlug).ifPresentOrElse(
                association -> {
                    String schema = TenantProvisioningService.schemaName(association.getSlug());
                    TenantContext.setTenantId(schema);
                },
                () -> log.warn("Tenant inconnu dans le JWT : {}", tenantSlug)
            );
        }
    }
}
