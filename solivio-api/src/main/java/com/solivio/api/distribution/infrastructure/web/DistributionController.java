package com.solivio.api.distribution.infrastructure.web;

import com.solivio.api.distribution.application.DistributionService;
import com.solivio.api.distribution.application.ModificationDistributionService;
import com.solivio.api.distribution.infrastructure.web.dto.AnnulerDistributionRequest;
import com.solivio.api.distribution.infrastructure.web.dto.CreateDistributionRequest;
import com.solivio.api.distribution.infrastructure.web.dto.DistributionResponse;
import com.solivio.api.distribution.infrastructure.web.dto.UpdateDistributionRequest;
import com.solivio.api.identity.SolivioUserDetails;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/distributions")
public class DistributionController {

    private final DistributionService distributionService;
    private final ModificationDistributionService modificationService;

    public DistributionController(DistributionService distributionService,
                                  ModificationDistributionService modificationService) {
        this.distributionService = distributionService;
        this.modificationService = modificationService;
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
        List<DistributionResponse> liste = estGestionnaire(user)
            ? distributionService.lister()
            : distributionService.listerPubliees();
        return ResponseEntity.ok(liste);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DistributionResponse> detail(
        @PathVariable UUID id,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        return ResponseEntity.ok(distributionService.detail(id, estGestionnaire(user)));
    }


    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('COORDINATEUR','RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<DistributionResponse> modifier(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateDistributionRequest request
    ) {
        return ResponseEntity.ok(modificationService.modifier(id, request));
    }

    // Brouillon uniquement : une distribution publiee s'annule (RG6).
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('COORDINATEUR','RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<Void> supprimer(@PathVariable UUID id) {
        modificationService.supprimer(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/publier")
    @PreAuthorize("hasAnyRole('COORDINATEUR','RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<DistributionResponse> publier(
        @PathVariable UUID id
    ) {
        DistributionResponse response = distributionService.publier(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/demarrer")
    @PreAuthorize("hasAnyRole('COORDINATEUR','RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<DistributionResponse> demarrer(
        @PathVariable UUID id
    ) {
        DistributionResponse response = distributionService.demarrer(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/terminer")
    @PreAuthorize("hasAnyRole('COORDINATEUR','RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<DistributionResponse> terminer(
        @PathVariable UUID id
    ) {
        DistributionResponse response = distributionService.terminer(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/annuler")
    @PreAuthorize("hasAnyRole('COORDINATEUR','RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<DistributionResponse> annuler(
        @PathVariable UUID id,
        @Valid @RequestBody AnnulerDistributionRequest request
    ) {
        DistributionResponse response = distributionService.annuler(id, request.motif());
        return ResponseEntity.ok(response);
    }

    private static boolean estGestionnaire(SolivioUserDetails user) {
        return user.aUnDesRoles("coordinateur", "responsable", "super_admin");
    }
}
