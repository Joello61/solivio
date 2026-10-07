package com.solivio.api.association.infrastructure.web;

import com.solivio.api.audit.application.AuditService;
import com.solivio.api.association.application.AssociationConfigService;
import com.solivio.api.association.application.AssociationExportService;
import com.solivio.api.association.application.AssociationLogoService;
import com.solivio.api.association.infrastructure.web.dto.AssociationResponse;
import com.solivio.api.association.infrastructure.web.dto.MembreResponse;
import com.solivio.api.association.infrastructure.web.dto.UpdateAssociationRequest;
import com.solivio.api.association.infrastructure.web.dto.UpdateRoleMembreRequest;
import com.solivio.api.association.infrastructure.web.dto.UpdateStatutMembreRequest;
import com.solivio.api.identity.infrastructure.security.SolivioUserDetails;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/association")
public class AssociationController {

    private final AssociationConfigService configService;
    private final AssociationExportService exportService;
    private final AssociationLogoService logoService;
    private final AuditService auditService;

    public AssociationController(
        AssociationConfigService configService,
        AssociationExportService exportService,
        AssociationLogoService logoService,
        AuditService auditService
    ) {
        this.configService = configService;
        this.exportService = exportService;
        this.logoService = logoService;
        this.auditService = auditService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('RESPONSABLE','COORDINATEUR','SUPER_ADMIN')")
    public ResponseEntity<AssociationResponse> lire(@AuthenticationPrincipal SolivioUserDetails user) {
        return ResponseEntity.ok(configService.lire());
    }

    @PatchMapping
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<AssociationResponse> mettreAJour(
        @Valid @RequestBody UpdateAssociationRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        AssociationResponse response = configService.mettreAJour(request);
        auditService.tracer(user.getCompteId(), "ASSOCIATION_MODIFIEE", "association", response.id());
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<AssociationResponse> uploadLogo(
        @RequestParam("file") MultipartFile file,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        AssociationResponse response = logoService.sauvegarderLogo(file);
        auditService.tracer(user.getCompteId(), "LOGO_MODIFIE", "association", response.id());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/membres")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<List<MembreResponse>> listerMembres(
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        return ResponseEntity.ok(configService.listerMembres());
    }

    @PatchMapping("/membres/{compteId}/role")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<MembreResponse> mettreAJourRole(
        @PathVariable UUID compteId,
        @Valid @RequestBody UpdateRoleMembreRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        MembreResponse response =
            configService.mettreAJourRole(compteId, request);
        auditService.tracer(user.getCompteId(), "ROLE_MEMBRE_MODIFIE", "compte", compteId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/membres/{compteId}/statut")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<MembreResponse> changerStatutMembre(
        @PathVariable UUID compteId,
        @Valid @RequestBody UpdateStatutMembreRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        MembreResponse response = configService.changerStatutMembre(compteId, request.statut());
        String action = "suspendu".equals(request.statut()) ? "MEMBRE_SUSPENDU" : "MEMBRE_REACTIVE";
        auditService.tracer(user.getCompteId(), action, "compte", compteId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/membres/{compteId}")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<Void> supprimerMembre(
        @PathVariable UUID compteId,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        configService.supprimerMembre(compteId);
        auditService.tracer(user.getCompteId(), "MEMBRE_SUSPENDU", "compte", compteId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<byte[]> exporter(@AuthenticationPrincipal SolivioUserDetails user) {
        byte[] zip = exportService.exporterEnZip();
        String filename = "export-solivio.zip";
        auditService.tracer(user.getCompteId(), "EXPORT_DONNEES", "association", null);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .body(zip);
    }
}
