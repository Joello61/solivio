package com.solivio.api.evenement.infrastructure.web;

import com.solivio.api.audit.application.AuditService;
import com.solivio.api.evenement.application.ParticipationEvenementService;
import com.solivio.api.evenement.domain.RoleParticipation;
import com.solivio.api.evenement.infrastructure.web.dto.ParticipationEvenementResponse;
import com.solivio.api.evenement.infrastructure.web.dto.ParticipationRequest;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/evenements/{id}/participations")
public class ParticipationEvenementController {

    private final ParticipationEvenementService participationService;
    private final AuditService auditService;

    public ParticipationEvenementController(
        ParticipationEvenementService participationService,
        AuditService auditService
    ) {
        this.participationService = participationService;
        this.auditService = auditService;
    }

    @PostMapping
    public ResponseEntity<ParticipationEvenementResponse> inscrire(
        @PathVariable UUID id,
        @Valid @RequestBody ParticipationRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        List<String> roles = user.getAuthorities().stream()
            .map(a -> a.getAuthority().replace("ROLE_", "").toLowerCase())
            .toList();
        RoleParticipation role = RoleParticipation.valueOf(request.role().toUpperCase());
        ParticipationEvenementResponse response =
            participationService.inscrire(id, user.getUsername(), role, roles);
        auditService.tracer(user.getCompteId(), "EVENEMENT_INSCRIPTION", "evenement", id);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/moi")
    public ResponseEntity<Void> seDesinscrire(
        @PathVariable UUID id,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        participationService.seDesinscrire(id, user.getUsername());
        auditService.tracer(user.getCompteId(), "EVENEMENT_DESINSCRIPTION", "evenement", id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('COORDINATEUR','RESPONSABLE','ADMIN','SUPER_ADMIN')")
    public ResponseEntity<List<ParticipationEvenementResponse>> listerParticipants(
        @PathVariable UUID id
    ) {
        return ResponseEntity.ok(participationService.listerParticipants(id));
    }
}
