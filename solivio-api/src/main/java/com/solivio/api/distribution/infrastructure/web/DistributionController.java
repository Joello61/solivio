package com.solivio.api.distribution.infrastructure.web;

import com.solivio.api.audit.application.AuditService;
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
import java.util.Objects;
import java.util.UUID;

@RestController
@RequestMapping("/api/distributions")
public class DistributionController {

    private final DistributionService distributionService;
    private final AuditService auditService;

    public DistributionController(DistributionService distributionService, AuditService auditService) {
        this.distributionService = distributionService;
        this.auditService = auditService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('COORDINATEUR','RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<DistributionResponse> creer(
        @Valid @RequestBody CreateDistributionRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        DistributionResponse response = distributionService.creer(request, user.getUsername());
        auditService.tracer(user.getCompteId(), "DISTRIBUTION_CREEE", "distribution", response.id());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<DistributionResponse>> lister(
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        boolean voitTout = user.getAuthorities().stream()
            .anyMatch(a -> Objects.equals(a.getAuthority(),
                "ROLE_COORDINATEUR")
                ||
                Objects.equals(a.getAuthority(),
                    "ROLE_RESPONSABLE")
                ||
                Objects.equals(a.getAuthority(),
                    "ROLE_SUPER_ADMIN"));
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
        DistributionResponse response = distributionService.publier(id);
        auditService.tracer(user.getCompteId(), "DISTRIBUTION_PUBLIEE", "distribution", id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/demarrer")
    @PreAuthorize("hasAnyRole('COORDINATEUR','RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<DistributionResponse> demarrer(
        @PathVariable UUID id,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        DistributionResponse response = distributionService.demarrer(id);
        auditService.tracer(user.getCompteId(), "DISTRIBUTION_DEMARREE", "distribution", id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/terminer")
    @PreAuthorize("hasAnyRole('COORDINATEUR','RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<DistributionResponse> terminer(
        @PathVariable UUID id,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        DistributionResponse response = distributionService.terminer(id);
        auditService.tracer(user.getCompteId(), "DISTRIBUTION_TERMINEE", "distribution", id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/annuler")
    @PreAuthorize("hasAnyRole('COORDINATEUR','RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<DistributionResponse> annuler(
        @PathVariable UUID id,
        @Valid @RequestBody AnnulerDistributionRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        DistributionResponse response = distributionService.annuler(id, request.motif());
        auditService.tracer(user.getCompteId(), "DISTRIBUTION_ANNULEE", "distribution", id);
        return ResponseEntity.ok(response);
    }
}
