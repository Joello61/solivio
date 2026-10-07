package com.solivio.api.identity.infrastructure.web;

import com.solivio.api.audit.application.AuditService;
import com.solivio.api.identity.SolivioUserDetails;
import com.solivio.api.identity.application.MembreService;
import com.solivio.api.identity.infrastructure.web.dto.MembreResponse;
import com.solivio.api.identity.infrastructure.web.dto.UpdateRoleMembreRequest;
import com.solivio.api.identity.infrastructure.web.dto.UpdateStatutMembreRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Gestion des membres de l'association. Les URL restent sous /api/association
 * pour le frontend ; la logique appartient au module identity.
 */
@RestController
@RequestMapping("/api/association/membres")
public class MembreController {

    private final MembreService membreService;
    private final AuditService auditService;

    public MembreController(MembreService membreService, AuditService auditService) {
        this.membreService = membreService;
        this.auditService = auditService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<List<MembreResponse>> listerMembres(
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        return ResponseEntity.ok(membreService.lister());
    }

    @PatchMapping("/{compteId}/role")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<MembreResponse> mettreAJourRole(
        @PathVariable UUID compteId,
        @Valid @RequestBody UpdateRoleMembreRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        MembreResponse response =
            membreService.mettreAJourRole(compteId, request);
        auditService.tracer(user.getCompteId(), "ROLE_MEMBRE_MODIFIE", "compte", compteId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{compteId}/statut")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<MembreResponse> changerStatutMembre(
        @PathVariable UUID compteId,
        @Valid @RequestBody UpdateStatutMembreRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        MembreResponse response = membreService.changerStatut(compteId, request.statut());
        String action = "suspendu".equals(request.statut()) ? "MEMBRE_SUSPENDU" : "MEMBRE_REACTIVE";
        auditService.tracer(user.getCompteId(), action, "compte", compteId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{compteId}")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<Void> supprimerMembre(
        @PathVariable UUID compteId,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        membreService.suspendre(compteId);
        auditService.tracer(user.getCompteId(), "MEMBRE_SUSPENDU", "compte", compteId);
        return ResponseEntity.noContent().build();
    }
}
