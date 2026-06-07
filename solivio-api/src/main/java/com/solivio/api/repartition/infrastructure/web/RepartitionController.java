package com.solivio.api.repartition.infrastructure.web;

import com.solivio.api.repartition.application.RepartitionService;
import com.solivio.api.repartition.infrastructure.web.dto.DenreeResponse;
import com.solivio.api.repartition.infrastructure.web.dto.DotationResponse;
import com.solivio.api.repartition.infrastructure.web.dto.SaisirDenreeRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/distributions/{distributionId}")
public class RepartitionController {

    private final RepartitionService repartitionService;

    public RepartitionController(RepartitionService repartitionService) {
        this.repartitionService = repartitionService;
    }

    @PostMapping("/denrees")
    @PreAuthorize("hasAnyRole('COORDINATEUR','RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<DenreeResponse> saisirDenree(
        @PathVariable UUID distributionId,
        @Valid @RequestBody SaisirDenreeRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(repartitionService.saisirDenree(distributionId, request));
    }

    @PutMapping("/denrees/{denreeId}")
    @PreAuthorize("hasAnyRole('COORDINATEUR','RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<DenreeResponse> modifierDenree(
        @PathVariable UUID distributionId,
        @PathVariable UUID denreeId,
        @Valid @RequestBody SaisirDenreeRequest request
    ) {
        return ResponseEntity.ok(repartitionService.modifierDenree(distributionId, denreeId, request));
    }

    @DeleteMapping("/denrees/{denreeId}")
    @PreAuthorize("hasAnyRole('COORDINATEUR','RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<Void> supprimerDenree(
        @PathVariable UUID distributionId,
        @PathVariable UUID denreeId
    ) {
        repartitionService.supprimerDenree(distributionId, denreeId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/denrees")
    @PreAuthorize("hasAnyRole('COORDINATEUR','RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<List<DenreeResponse>> listerDenrees(
        @PathVariable UUID distributionId
    ) {
        return ResponseEntity.ok(repartitionService.listerDenrees(distributionId));
    }

    @GetMapping("/repartition")
    @PreAuthorize("hasAnyRole('COORDINATEUR','RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<DotationResponse> calculerDotation(
        @PathVariable UUID distributionId,
        @RequestParam(required = false) String base
    ) {
        return ResponseEntity.ok(repartitionService.calculerDotation(distributionId, base));
    }
}
