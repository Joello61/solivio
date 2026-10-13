package com.solivio.api.collecte.infrastructure.web;

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

    public MissionCollecteController(MissionCollecteService missionService) {
        this.missionService = missionService;
    }

    // Reserve aux benevoles, et par la hierarchie aux coordinateurs et responsables.
    @GetMapping
    @PreAuthorize("hasAnyRole('BENEVOLE','SUPER_ADMIN')")
    public ResponseEntity<List<MissionCollecteResponse>> lister(
        @RequestParam(required = false) String statut,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        StatutMission filtre = statut != null ? StatutMission.valueOf(statut.toUpperCase()) : null;
        return ResponseEntity.ok(missionService.lister(filtre, user.getUsername(), estGestionnaire(user)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<MissionCollecteResponse> creer(
        @Valid @RequestBody CreateMissionCollecteRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        MissionCollecteResponse response = missionService.creer(request, user.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('BENEVOLE','SUPER_ADMIN')")
    public ResponseEntity<MissionCollecteResponse> detail(
        @PathVariable UUID id,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        return ResponseEntity.ok(missionService.detail(id, user.getUsername(), estGestionnaire(user)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<MissionCollecteResponse> modifier(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateMissionCollecteRequest request
    ) {
        MissionCollecteResponse response = missionService.modifier(id, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/annuler")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN','BENEVOLE')")
    public ResponseEntity<MissionCollecteResponse> annuler(
        @PathVariable UUID id,
        @Valid @RequestBody AnnulerMissionRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        MissionCollecteResponse response = missionService.annuler(id, request,
            user.getUsername(), estGestionnaire(user));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/prendre")
    @PreAuthorize("hasRole('BENEVOLE')")
    public ResponseEntity<MissionCollecteResponse> prendre(
        @PathVariable UUID id,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        MissionCollecteResponse response = missionService.prendre(id, user.getUsername());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}/liberer")
    @PreAuthorize("hasRole('BENEVOLE')")
    public ResponseEntity<MissionCollecteResponse> liberer(
        @PathVariable UUID id,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        MissionCollecteResponse response = missionService.liberer(id, user.getUsername());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/valider-collecte")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<MissionCollecteResponse> validerCollecte(
        @PathVariable UUID id
    ) {
        MissionCollecteResponse response = missionService.validerCollecte(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/valider-depot")
    @PreAuthorize("hasRole('BENEVOLE')")
    public ResponseEntity<MissionCollecteResponse> validerDepot(
        @PathVariable UUID id,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        MissionCollecteResponse response = missionService.validerDepot(id, user.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/mes-missions")
    @PreAuthorize("hasRole('BENEVOLE')")
    public ResponseEntity<List<MissionCollecteResponse>> mesMissions(
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        return ResponseEntity.ok(missionService.mesMissions(user.getUsername()));
    }

    // Les missions sont creees et validees par les responsables : eux seuls voient
    // qui est assigne et peuvent annuler n'importe quelle mission.
    private static boolean estGestionnaire(SolivioUserDetails user) {
        return user.aUnDesRoles("responsable", "super_admin");
    }
}
