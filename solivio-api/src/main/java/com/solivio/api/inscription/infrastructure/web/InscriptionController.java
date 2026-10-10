package com.solivio.api.inscription.infrastructure.web;

import com.solivio.api.identity.SolivioUserDetails;
import com.solivio.api.inscription.application.InscriptionService;
import com.solivio.api.inscription.infrastructure.web.dto.InscrireRequest;
import com.solivio.api.inscription.infrastructure.web.dto.InscriptionResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/distributions/{distributionId}/inscriptions")
public class InscriptionController {

    private final InscriptionService inscriptionService;

    public InscriptionController(InscriptionService inscriptionService) {
        this.inscriptionService = inscriptionService;
    }

    // Un membre suspendu porte un jeton sans role : il ne peut plus s'inscrire.
    @PostMapping
    @PreAuthorize("hasAnyRole('BENEFICIAIRE','BENEVOLE','COORDINATEUR','RESPONSABLE')")
    public ResponseEntity<InscriptionResponse> inscrire(
        @PathVariable UUID distributionId,
        @Valid @RequestBody InscrireRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        InscriptionResponse response = inscriptionService.inscrire(
            distributionId,
            user.getUsername(),
            request.type(),
            request.creneauId(),
            user.roles()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/mes")
    public ResponseEntity<List<InscriptionResponse>> mesInscriptions(
        @PathVariable UUID distributionId,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        return ResponseEntity.ok(
            inscriptionService.mesinscriptions(user.getUsername(), distributionId)
        );
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('COORDINATEUR','RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<List<InscriptionResponse>> listerInscrits(@PathVariable UUID distributionId) {
        return ResponseEntity.ok(inscriptionService.listerInscritsDistribution(distributionId));
    }

    @DeleteMapping("/{inscriptionId}")
    public ResponseEntity<Void> desinscrire(
        @PathVariable UUID distributionId,
        @PathVariable UUID inscriptionId,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        inscriptionService.desinscrire(distributionId, inscriptionId, user.getUsername());
        return ResponseEntity.noContent().build();
    }
}
