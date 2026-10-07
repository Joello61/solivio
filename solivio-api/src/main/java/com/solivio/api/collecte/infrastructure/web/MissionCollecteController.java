package com.solivio.api.collecte.infrastructure.web;

import com.solivio.api.audit.application.AuditService;
import com.solivio.api.collecte.application.MissionCollecteService;
import com.solivio.api.collecte.domain.StatutMission;
import com.solivio.api.collecte.infrastructure.web.dto.AnnulerMissionRequest;
import com.solivio.api.collecte.infrastructure.web.dto.CreateMissionCollecteRequest;
import com.solivio.api.collecte.infrastructure.web.dto.MissionCollecteResponse;
import com.solivio.api.collecte.infrastructure.web.dto.UpdateMissionCollecteRequest;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/missions-collecte")
public class MissionCollecteController {

    private final MissionCollecteService missionService;
    private final AuditService auditService;

    public MissionCollecteController(MissionCollecteService missionService, AuditService auditService) {
        this.missionService = missionService;
        this.auditService = auditService;
    }

    @GetMapping
    public ResponseEntity<List<MissionCollecteResponse>> lister(
        @RequestParam(required = false) String statut
    ) {
        StatutMission filtre = statut != null ? StatutMission.valueOf(statut.toUpperCase()) : null;
        return ResponseEntity.ok(missionService.lister(filtre));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<MissionCollecteResponse> creer(
        @Valid @RequestBody CreateMissionCollecteRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        MissionCollecteResponse response = missionService.creer(request, user.getUsername());
        auditService.tracer(user.getCompteId(), "MISSION_COLLECTE_CREEE", "mission_collecte", response.id());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MissionCollecteResponse> detail(@PathVariable UUID id) {
        return ResponseEntity.ok(missionService.detail(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<MissionCollecteResponse> modifier(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateMissionCollecteRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        MissionCollecteResponse response = missionService.modifier(id, request);
        auditService.tracer(user.getCompteId(), "MISSION_COLLECTE_MODIFIEE", "mission_collecte", id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/annuler")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE','SUPER_ADMIN','BENEVOLE')")
    public ResponseEntity<MissionCollecteResponse> annuler(
        @PathVariable UUID id,
        @Valid @RequestBody AnnulerMissionRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        MissionCollecteResponse response = missionService.annuler(id, request,
            user.getUsername());
        auditService.tracer(user.getCompteId(), "MISSION_COLLECTE_ANNULEE", "mission_collecte", id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/prendre")
    @PreAuthorize("hasRole('BENEVOLE')")
    public ResponseEntity<MissionCollecteResponse> prendre(
        @PathVariable UUID id,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        MissionCollecteResponse response = missionService.prendre(id, user.getUsername());
        auditService.tracer(user.getCompteId(), "MISSION_COLLECTE_PRISE", "mission_collecte", id);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}/liberer")
    @PreAuthorize("hasRole('BENEVOLE')")
    public ResponseEntity<MissionCollecteResponse> liberer(
        @PathVariable UUID id,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        MissionCollecteResponse response = missionService.liberer(id, user.getUsername());
        auditService.tracer(user.getCompteId(), "MISSION_COLLECTE_LIBEREE", "mission_collecte", id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/valider-collecte")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<MissionCollecteResponse> validerCollecte(
        @PathVariable UUID id,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        MissionCollecteResponse response = missionService.validerCollecte(id);
        auditService.tracer(user.getCompteId(), "MISSION_COLLECTE_VALIDEE", "mission_collecte", id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/valider-depot")
    @PreAuthorize("hasRole('BENEVOLE')")
    public ResponseEntity<MissionCollecteResponse> validerDepot(
        @PathVariable UUID id,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        MissionCollecteResponse response = missionService.validerDepot(id, user.getUsername());
        auditService.tracer(user.getCompteId(), "MISSION_DEPOT_VALIDE", "mission_collecte", id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/mes-missions")
    public ResponseEntity<List<MissionCollecteResponse>> mesMissions(
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        return ResponseEntity.ok(missionService.mesMissions(user.getUsername()));
    }
}
