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
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Alimente le TenantContext apres l'authentification JWT.
 * Lit le claim "association_id" du token et resout le schema tenant correspondant.
 * Nettoie le contexte apres chaque requete pour eviter les fuites entre requetes.
 */
@Component
public class TenantResolutionFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(TenantResolutionFilter.class);
    private static final String ASSOCIATION_ID_CLAIM = "association_id";

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
        if (!(auth instanceof JwtAuthenticationToken jwtToken)) {
            return;
        }

        Jwt jwt = jwtToken.getToken();
        String associationId = jwt.getClaimAsString(ASSOCIATION_ID_CLAIM);
        if (associationId == null || associationId.isBlank()) {
            log.debug("JWT has no association_id claim, tenant not set");
            return;
        }

        associationRepository.findBySlug(associationId).ifPresentOrElse(
            association -> {
                String schema = TenantProvisioningService.schemaName(association.getSlug());
                TenantContext.setTenantId(schema);
            },
            () -> log.warn("Unknown association_id in JWT: {}", associationId)
        );
    }
}
