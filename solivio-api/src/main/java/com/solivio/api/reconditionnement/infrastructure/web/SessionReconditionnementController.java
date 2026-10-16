package com.solivio.api.reconditionnement.infrastructure.web;

import com.solivio.api.identity.SolivioUserDetails;
import com.solivio.api.reconditionnement.application.SessionReconditionnementService;
import com.solivio.api.reconditionnement.infrastructure.web.dto.AnnulerSessionRequest;
import com.solivio.api.reconditionnement.infrastructure.web.dto.CreateSessionReconditionnementRequest;
import com.solivio.api.reconditionnement.infrastructure.web.dto.InscriptionReconditionnementResponse;
import com.solivio.api.reconditionnement.infrastructure.web.dto.PointageReconditionnementRequest;
import com.solivio.api.reconditionnement.infrastructure.web.dto.SessionReconditionnementResponse;
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
@RequestMapping("/api/sessions-reconditionnement")
public class SessionReconditionnementController {

    private final SessionReconditionnementService sessionService;

    public SessionReconditionnementController(
        SessionReconditionnementService sessionService
    ) {
        this.sessionService = sessionService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<SessionReconditionnementResponse> creer(
        @Valid @RequestBody CreateSessionReconditionnementRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        SessionReconditionnementResponse response = sessionService.creer(request, user.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Le reconditionnement est un travail benevole : les beneficiaires ne voient pas les sessions.
    @GetMapping
    @PreAuthorize("hasAnyRole('BENEVOLE','COORDINATEUR','SUPER_ADMIN')")
    public ResponseEntity<List<SessionReconditionnementResponse>> lister(
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        List<SessionReconditionnementResponse> liste = estGestionnaire(user)
            ? sessionService.lister()
            : sessionService.listerPubliees();
        return ResponseEntity.ok(liste);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('BENEVOLE','COORDINATEUR','SUPER_ADMIN')")
    public ResponseEntity<SessionReconditionnementResponse> detail(
        @PathVariable UUID id,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        return ResponseEntity.ok(sessionService.detail(id, estGestionnaire(user)));
    }

    @PostMapping("/{id}/publier")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<SessionReconditionnementResponse> publier(
        @PathVariable UUID id
    ) {
        SessionReconditionnementResponse response = sessionService.publier(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/demarrer")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<SessionReconditionnementResponse> demarrer(
        @PathVariable UUID id
    ) {
        SessionReconditionnementResponse response = sessionService.demarrer(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/terminer")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<SessionReconditionnementResponse> terminer(
        @PathVariable UUID id
    ) {
        SessionReconditionnementResponse response = sessionService.terminer(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/annuler")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<SessionReconditionnementResponse> annuler(
        @PathVariable UUID id,
        @Valid @RequestBody AnnulerSessionRequest request
    ) {
        SessionReconditionnementResponse response =
            sessionService.annuler(id, request);
        return ResponseEntity.ok(response);
    }

    // Le reconditionnement des denrees est un travail benevole.
    @PostMapping("/{id}/inscrire")
    @PreAuthorize("hasRole('BENEVOLE')")
    public ResponseEntity<InscriptionReconditionnementResponse> inscrire(
        @PathVariable UUID id,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(sessionService.inscrire(id, user.getUsername()));
    }

    @DeleteMapping("/{id}/desinscrire")
    public ResponseEntity<Void> desinscrire(
        @PathVariable UUID id,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        sessionService.desinscrire(id, user.getUsername());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/inscrits")
    @PreAuthorize("hasAnyRole('COORDINATEUR','RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<List<InscriptionReconditionnementResponse>> listerInscrits(
        @PathVariable UUID id
    ) {
        return ResponseEntity.ok(sessionService.listerInscrits(id));
    }

    @GetMapping("/{id}/inscriptions/mes")
    public ResponseEntity<List<InscriptionReconditionnementResponse>> mesInscriptions(
        @PathVariable UUID id,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        return ResponseEntity.ok(sessionService.mesInscriptions(id, user.getUsername()));
    }

    @GetMapping("/mes-inscriptions")
    public ResponseEntity<List<InscriptionReconditionnementResponse>> toutesMesInscriptions(
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        return ResponseEntity.ok(sessionService.toutesInscriptions(user.getUsername()));
    }

    @PostMapping("/{id}/pointage")
    @PreAuthorize("hasAnyRole('COORDINATEUR','RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<InscriptionReconditionnementResponse> pointer(
        @PathVariable UUID id,
        @Valid @RequestBody PointageReconditionnementRequest request
    ) {
        InscriptionReconditionnementResponse response = sessionService.pointer(id, request);
        return ResponseEntity.ok(response);
    }

    private static boolean estGestionnaire(SolivioUserDetails user) {
        return user.aUnDesRoles("coordinateur", "responsable", "super_admin");
    }
}
