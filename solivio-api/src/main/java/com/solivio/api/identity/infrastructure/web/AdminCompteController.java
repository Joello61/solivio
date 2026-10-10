package com.solivio.api.identity.infrastructure.web;

import com.solivio.api.audit.application.AuditService;
import com.solivio.api.identity.application.AdminCompteService;
import com.solivio.api.identity.SolivioUserDetails;
import com.solivio.api.identity.infrastructure.web.dto.CompteAdminResponse;
import com.solivio.api.identity.infrastructure.web.dto.UpdateStatutCompteRequest;
import com.solivio.api.identity.infrastructure.web.dto.UpdateSuperAdminRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/comptes")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminCompteController {

    private final AdminCompteService adminCompteService;
    private final AuditService auditService;

    public AdminCompteController(AdminCompteService adminCompteService, AuditService auditService) {
        this.adminCompteService = adminCompteService;
        this.auditService = auditService;
    }

    @GetMapping
    public ResponseEntity<Page<CompteAdminResponse>> lister(
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int taille
    ) {
        return ResponseEntity.ok(adminCompteService.lister(q, page, Math.min(taille, 100)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CompteAdminResponse> lireParId(@PathVariable UUID id) {
        return ResponseEntity.ok(adminCompteService.lireParId(id));
    }

    @PatchMapping("/{id}/statut")
    public ResponseEntity<CompteAdminResponse> mettreAJourStatut(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateStatutCompteRequest request,
        @AuthenticationPrincipal SolivioUserDetails userDetails
    ) {
        CompteAdminResponse response = adminCompteService.mettreAJourStatut(
            id, request.actif(), userDetails.getCompteId());
        String action = request.actif() ? "COMPTE_ACTIVE" : "COMPTE_DESACTIVE";
        auditService.tracer(userDetails.getCompteId(), action, "compte", id);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/super-admin")
    public ResponseEntity<CompteAdminResponse> mettreAJourSuperAdmin(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateSuperAdminRequest request,
        @AuthenticationPrincipal SolivioUserDetails userDetails
    ) {
        CompteAdminResponse response = adminCompteService.mettreAJourSuperAdmin(
            id, request.superAdmin(), userDetails.getCompteId());
        auditService.tracer(userDetails.getCompteId(), "SUPER_ADMIN_MODIFIE", "compte", id);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(
        @PathVariable UUID id,
        @AuthenticationPrincipal SolivioUserDetails userDetails
    ) {
        adminCompteService.supprimer(id, userDetails.getCompteId());
        auditService.tracer(userDetails.getCompteId(), "COMPTE_SUPPRIME", "compte", id);
        return ResponseEntity.noContent().build();
    }
}
