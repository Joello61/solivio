package com.solivio.api.distribution.infrastructure.web;

import com.solivio.api.distribution.application.DistributionService;
import com.solivio.api.distribution.infrastructure.web.dto.AnnulerDistributionRequest;
import com.solivio.api.distribution.infrastructure.web.dto.CreateDistributionRequest;
import com.solivio.api.distribution.infrastructure.web.dto.DistributionResponse;
import com.solivio.api.identity.infrastructure.security.SolivioUserDetails;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/distributions")
public class DistributionController {

    private final DistributionService distributionService;

    public DistributionController(DistributionService distributionService) {
        this.distributionService = distributionService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('COORDINATEUR','RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<DistributionResponse> creer(
        @Valid @RequestBody CreateDistributionRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        DistributionResponse response = distributionService.creer(request, user.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<DistributionResponse>> lister(
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        // Les coordinateurs/responsables voient tout ; les autres voient uniquement les publiees.
        boolean voitTout = user.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_COORDINATEUR")
                || a.getAuthority().equals("ROLE_RESPONSABLE")
                || a.getAuthority().equals("ROLE_SUPER_ADMIN"));
        List<DistributionResponse> liste = voitTout
            ? distributionService.lister()
            : distributionService.listerPubliees();
        return ResponseEntity.ok(liste);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DistributionResponse> detail(@PathVariable UUID id) {
        return ResponseEntity.ok(distributionService.detail(id));
    }

    @PostMapping("/{id}/publier")
    @PreAuthorize("hasAnyRole('COORDINATEUR','RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<DistributionResponse> publier(
        @PathVariable UUID id,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        return ResponseEntity.ok(distributionService.publier(id, user.getTenantSlug()));
    }

    @PostMapping("/{id}/demarrer")
    @PreAuthorize("hasAnyRole('COORDINATEUR','RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<DistributionResponse> demarrer(@PathVariable UUID id) {
        return ResponseEntity.ok(distributionService.demarrer(id));
    }

    @PostMapping("/{id}/terminer")
    @PreAuthorize("hasAnyRole('COORDINATEUR','RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<DistributionResponse> terminer(
        @PathVariable UUID id,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        return ResponseEntity.ok(distributionService.terminer(id, user.getTenantSlug()));
    }

    @PostMapping("/{id}/annuler")
    @PreAuthorize("hasAnyRole('COORDINATEUR','RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<DistributionResponse> annuler(
        @PathVariable UUID id,
        @Valid @RequestBody AnnulerDistributionRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        return ResponseEntity.ok(distributionService.annuler(id, request.motif(), user.getTenantSlug()));
    }
}
