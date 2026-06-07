package com.solivio.api.inscription.infrastructure.web;

import com.solivio.api.audit.application.AuditService;
import com.solivio.api.identity.infrastructure.security.SolivioUserDetails;
import com.solivio.api.inscription.application.InscriptionService;
import com.solivio.api.inscription.infrastructure.web.dto.InscriptionResponse;
import com.solivio.api.inscription.infrastructure.web.dto.PointageInfoResponse;
import com.solivio.api.inscription.infrastructure.web.dto.PointerPresenceRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/distributions/{distributionId}/pointage")
@PreAuthorize("hasAnyRole('COORDINATEUR','RESPONSABLE','BENEVOLE','SUPER_ADMIN')")
public class PointageController {

    private final InscriptionService inscriptionService;
    private final AuditService auditService;

    public PointageController(InscriptionService inscriptionService, AuditService auditService) {
        this.inscriptionService = inscriptionService;
        this.auditService = auditService;
    }

    // Recherche par nom/prenom. Aucune donnee sensible (profil_beneficiaire) n'est retournee (RG5).
    @GetMapping
    public ResponseEntity<List<PointageInfoResponse>> rechercher(
        @PathVariable UUID distributionId,
        @RequestParam(defaultValue = "") String q
    ) {
        return ResponseEntity.ok(inscriptionService.rechercherPourPointage(distributionId, q));
    }

    @PutMapping("/{inscriptionId}")
    public ResponseEntity<InscriptionResponse> pointer(
        @PathVariable UUID distributionId,
        @PathVariable UUID inscriptionId,
        @Valid @RequestBody PointerPresenceRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        InscriptionResponse response = inscriptionService.pointer(
            inscriptionId, request.presence(), user.getUsername(), user.getTenantSlug()
        );
        auditService.tracer(user.getCompteId(), "POINTAGE", "inscription", inscriptionId);
        return ResponseEntity.ok(response);
    }
}
