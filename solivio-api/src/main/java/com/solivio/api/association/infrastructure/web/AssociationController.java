package com.solivio.api.association.infrastructure.web;

import com.solivio.api.association.application.AssociationConfigService;
import com.solivio.api.association.application.AssociationExportService;
import com.solivio.api.association.application.AssociationSupprimerService;
import com.solivio.api.association.infrastructure.web.dto.AssociationResponse;
import com.solivio.api.association.infrastructure.web.dto.MembreResponse;
import com.solivio.api.association.infrastructure.web.dto.UpdateAssociationRequest;
import com.solivio.api.association.infrastructure.web.dto.UpdateRoleMembreRequest;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/association")
public class AssociationController {

    private final AssociationConfigService configService;
    private final AssociationExportService exportService;
    private final AssociationSupprimerService supprimerService;

    public AssociationController(
        AssociationConfigService configService,
        AssociationExportService exportService,
        AssociationSupprimerService supprimerService
    ) {
        this.configService = configService;
        this.exportService = exportService;
        this.supprimerService = supprimerService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('RESPONSABLE','COORDINATEUR','SUPER_ADMIN')")
    public ResponseEntity<AssociationResponse> lire(@AuthenticationPrincipal SolivioUserDetails user) {
        return ResponseEntity.ok(configService.lire(user.getTenantSlug()));
    }

    @PatchMapping
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<AssociationResponse> mettreAJour(
        @Valid @RequestBody UpdateAssociationRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        return ResponseEntity.ok(configService.mettreAJour(user.getTenantSlug(), request));
    }

    @GetMapping("/membres")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<List<MembreResponse>> listerMembres(
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        return ResponseEntity.ok(configService.listerMembres(user.getTenantSlug()));
    }

    @PatchMapping("/membres/{compteId}/role")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<MembreResponse> mettreAJourRole(
        @PathVariable UUID compteId,
        @Valid @RequestBody UpdateRoleMembreRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        return ResponseEntity.ok(
            configService.mettreAJourRole(user.getTenantSlug(), compteId, request)
        );
    }

    @DeleteMapping("/membres/{compteId}")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<Void> supprimerMembre(
        @PathVariable UUID compteId,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        configService.supprimerMembre(user.getTenantSlug(), compteId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<byte[]> exporter(@AuthenticationPrincipal SolivioUserDetails user) {
        byte[] zip = exportService.exporterEnZip(user.getTenantSlug());
        String filename = "export-" + user.getTenantSlug() + ".zip";
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .body(zip);
    }

    @DeleteMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> supprimer(@AuthenticationPrincipal SolivioUserDetails user) {
        supprimerService.supprimer(user.getTenantSlug());
        return ResponseEntity.noContent().build();
    }
}
