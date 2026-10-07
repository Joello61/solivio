package com.solivio.api.evenement.infrastructure.web;

import com.solivio.api.audit.application.AuditService;
import com.solivio.api.evenement.application.ParticipationEvenementService;
import com.solivio.api.evenement.infrastructure.web.dto.ParticipationEvenementResponse;
import com.solivio.api.evenement.infrastructure.web.dto.PointageEvenementRequest;
import com.solivio.api.identity.SolivioUserDetails;
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
@RequestMapping("/api/evenements/{id}/pointage")
@PreAuthorize("hasAnyRole('COORDINATEUR','RESPONSABLE','ADMIN','SUPER_ADMIN')")
public class PointageEvenementController {

    private final ParticipationEvenementService participationService;
    private final AuditService auditService;

    public PointageEvenementController(
        ParticipationEvenementService participationService,
        AuditService auditService
    ) {
        this.participationService = participationService;
        this.auditService = auditService;
    }

    @GetMapping
    public ResponseEntity<List<ParticipationEvenementResponse>> listerPourPointage(
        @PathVariable UUID id,
        @RequestParam(required = false) String q
    ) {
        return ResponseEntity.ok(participationService.listerPourPointage(id, q));
    }

    @PutMapping("/{participationId}")
    public ResponseEntity<ParticipationEvenementResponse> pointer(
        @PathVariable UUID id,
        @PathVariable UUID participationId,
        @Valid @RequestBody PointageEvenementRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        ParticipationEvenementResponse response =
            participationService.pointer(id, participationId, request.presence());
        auditService.tracer(user.getCompteId(), "EVENEMENT_POINTAGE", "participation_evenement", participationId);
        return ResponseEntity.ok(response);
    }
}
