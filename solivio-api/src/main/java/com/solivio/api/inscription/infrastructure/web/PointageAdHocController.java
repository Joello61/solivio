package com.solivio.api.inscription.infrastructure.web;

import com.solivio.api.audit.application.AuditService;
import com.solivio.api.identity.SolivioUserDetails;
import com.solivio.api.inscription.application.PointageAdHocService;
import com.solivio.api.inscription.infrastructure.web.dto.AjouterBenevoleExistantRequest;
import com.solivio.api.inscription.infrastructure.web.dto.AjouterVisiteurRequest;
import com.solivio.api.inscription.infrastructure.web.dto.PointageAdHocResponse;
import com.solivio.api.inscription.infrastructure.web.dto.PointageInfoResponse;
import com.solivio.api.shared.identity.PersonneQueryPort;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/distributions/{distributionId}/pointage/ad-hoc")
@PreAuthorize("hasAnyRole('COORDINATEUR','RESPONSABLE','SUPER_ADMIN')")
public class PointageAdHocController {

    private final PointageAdHocService service;
    private final AuditService auditService;

    public PointageAdHocController(PointageAdHocService service, AuditService auditService) {
        this.service = service;
        this.auditService = auditService;
    }

    // Recherche de membres existants pour la suggestion dans le dialog.
    @GetMapping("/membres")
    public ResponseEntity<List<PersonneQueryPort.PersonneContactInfo>> rechercherMembres(
        @PathVariable UUID distributionId,
        @RequestParam(defaultValue = "") String q
    ) {
        return ResponseEntity.ok(service.rechercherMembres(q));
    }

    @PostMapping("/benevole-existant")
    public ResponseEntity<PointageInfoResponse> ajouterBenevoleExistant(
        @PathVariable UUID distributionId,
        @Valid @RequestBody AjouterBenevoleExistantRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        PointageInfoResponse response = service.ajouterCompteExistant(
            distributionId, request.personneId(), user.getUsername()
        );
        auditService.tracer(user.getCompteId(), "AJOUT_BENEVOLE_AD_HOC", "distribution", distributionId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/visiteur")
    public ResponseEntity<PointageAdHocResponse> ajouterVisiteur(
        @PathVariable UUID distributionId,
        @Valid @RequestBody AjouterVisiteurRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        PointageAdHocResponse response = service.ajouterVisiteur(
            distributionId, request.nom(), request.prenom(), request.email(), request.role()
        );
        auditService.tracer(user.getCompteId(), "AJOUT_VISITEUR_AD_HOC", "distribution", distributionId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<PointageAdHocResponse>> lister(
        @PathVariable UUID distributionId
    ) {
        return ResponseEntity.ok(service.lister(distributionId));
    }

    @PostMapping("/{adHocId}/invitation")
    public ResponseEntity<Void> envoyerInvitation(
        @PathVariable UUID distributionId,
        @PathVariable UUID adHocId,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        service.envoyerInvitation(adHocId, user.getCompteId());
        auditService.tracer(user.getCompteId(), "INVITATION_VISITEUR_AD_HOC", "pointage_ad_hoc", adHocId);
        return ResponseEntity.ok().build();
    }
}
