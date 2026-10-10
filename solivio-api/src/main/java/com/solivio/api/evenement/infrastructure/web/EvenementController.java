package com.solivio.api.evenement.infrastructure.web;

import com.solivio.api.audit.application.AuditService;
import com.solivio.api.evenement.application.EvenementService;
import com.solivio.api.evenement.application.ParticipationEvenementService;
import com.solivio.api.evenement.infrastructure.web.dto.AnnulerEvenementRequest;
import com.solivio.api.evenement.infrastructure.web.dto.CreateEvenementRequest;
import com.solivio.api.evenement.infrastructure.web.dto.EvenementResponse;
import com.solivio.api.evenement.infrastructure.web.dto.ParticipationEvenementResponse;
import com.solivio.api.evenement.infrastructure.web.dto.UpdateEvenementRequest;
import com.solivio.api.identity.SolivioUserDetails;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
@RequestMapping("/api/evenements")
public class EvenementController {

    private final EvenementService evenementService;
    private final ParticipationEvenementService participationService;
    private final AuditService auditService;

    public EvenementController(
        EvenementService evenementService,
        ParticipationEvenementService participationService,
        AuditService auditService
    ) {
        this.evenementService = evenementService;
        this.participationService = participationService;
        this.auditService = auditService;
    }

    @GetMapping
    public ResponseEntity<List<EvenementResponse>> lister(
        @RequestParam(required = false) String statut,
        @RequestParam(required = false) String type
    ) {
        return ResponseEntity.ok(evenementService.lister(statut, type));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<EvenementResponse> creer(
        @Valid @RequestBody CreateEvenementRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        EvenementResponse response = evenementService.creer(request, user.getUsername());
        auditService.tracer(user.getCompteId(), "EVENEMENT_CREE", "evenement", response.id());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EvenementResponse> detail(@PathVariable UUID id) {
        return ResponseEntity.ok(evenementService.detail(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<EvenementResponse> modifier(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateEvenementRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        EvenementResponse response = evenementService.modifier(id, request);
        auditService.tracer(user.getCompteId(), "EVENEMENT_MODIFIE", "evenement", id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/publier")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<EvenementResponse> publier(
        @PathVariable UUID id,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        EvenementResponse response = evenementService.publier(id);
        auditService.tracer(user.getCompteId(), "EVENEMENT_PUBLIE", "evenement", id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/annuler")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<EvenementResponse> annuler(
        @PathVariable UUID id,
        @Valid @RequestBody AnnulerEvenementRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        EvenementResponse response = evenementService.annuler(id, request);
        auditService.tracer(user.getCompteId(), "EVENEMENT_ANNULE", "evenement", id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/mes-evenements")
    public ResponseEntity<List<ParticipationEvenementResponse>> mesEvenements(
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        return ResponseEntity.ok(participationService.mesEvenementsParticipations(user.getUsername()));
    }
}
