package com.solivio.api.identity.infrastructure.web;

import com.solivio.api.audit.application.AuditService;
import com.solivio.api.identity.SolivioUserDetails;
import com.solivio.api.identity.application.AuthService;
import com.solivio.api.identity.application.EffacementService;
import com.solivio.api.identity.application.GardeMembres;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Effacement des donnees personnelles : par la personne elle-meme, ou par un
 * super administrateur pour une demande recue hors de l'application.
 */
@RestController
public class EffacementController {

    private static final String ACTION = "DONNEES_EFFACEES";

    private final EffacementService effacementService;
    private final AuthService authService;
    private final GardeMembres garde;
    private final AuditService auditService;

    public EffacementController(EffacementService effacementService, AuthService authService,
                                GardeMembres garde, AuditService auditService) {
        this.effacementService = effacementService;
        this.authService = authService;
        this.garde = garde;
        this.auditService = auditService;
    }

    @DeleteMapping("/api/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> effacerMesDonnees(
        @AuthenticationPrincipal SolivioUserDetails user,
        HttpServletResponse response
    ) {
        effacementService.effacer(user.getCompteId());
        auditService.tracer(user.getCompteId(), ACTION, "compte", user.getCompteId());
        authService.supprimerCookies(response);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/admin/comptes/{id}/effacement")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> effacerLesDonnees(
        @PathVariable UUID id,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        // Pour ses propres donnees, le super admin passe par DELETE /api/me.
        garde.interdireSurSoi(user.getCompteId(), id);
        effacementService.effacer(id);
        auditService.tracer(user.getCompteId(), ACTION, "compte", id);
        return ResponseEntity.noContent().build();
    }
}
