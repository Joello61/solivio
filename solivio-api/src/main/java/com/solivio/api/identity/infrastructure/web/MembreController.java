package com.solivio.api.identity.infrastructure.web;

import com.solivio.api.identity.SolivioUserDetails;
import com.solivio.api.identity.application.MembreService;
import com.solivio.api.identity.application.ProfilBeneficiaireService;
import com.solivio.api.identity.infrastructure.web.dto.MembreResponse;
import com.solivio.api.identity.infrastructure.web.dto.ProfilBeneficiaireResponse;
import com.solivio.api.identity.infrastructure.web.dto.UpdateRolesMembreRequest;
import com.solivio.api.identity.infrastructure.web.dto.UpdateStatutMembreRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Gestion des membres de l'association. Les URL restent sous /api/association
 * pour le frontend ; la logique appartient au module identity.
 */
@RestController
@RequestMapping("/api/association/membres")
public class MembreController {

    private final MembreService membreService;
    private final ProfilBeneficiaireService profilBeneficiaireService;

    public MembreController(MembreService membreService, ProfilBeneficiaireService profilBeneficiaireService) {
        this.membreService = membreService;
        this.profilBeneficiaireService = profilBeneficiaireService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<List<MembreResponse>> listerMembres() {
        return ResponseEntity.ok(membreService.lister());
    }

    // RG5 : le dossier social n'est lisible que par le beneficiaire lui-meme et le responsable.
    @GetMapping("/{compteId}/profil-beneficiaire")
    @PreAuthorize("hasRole('RESPONSABLE')")
    public ResponseEntity<ProfilBeneficiaireResponse> lireDossier(@PathVariable UUID compteId) {
        return ResponseEntity.ok(profilBeneficiaireService.lirePourResponsable(compteId));
    }

    @PutMapping("/{compteId}/roles")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<MembreResponse> mettreAJourRoles(
        @PathVariable UUID compteId,
        @Valid @RequestBody UpdateRolesMembreRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        return ResponseEntity.ok(membreService.mettreAJourRoles(compteId, request, user.getCompteId()));
    }

    @PatchMapping("/{compteId}/statut")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<MembreResponse> changerStatutMembre(
        @PathVariable UUID compteId,
        @Valid @RequestBody UpdateStatutMembreRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        MembreResponse response = membreService.changerStatut(compteId, request.statut(), user.getCompteId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{compteId}")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<Void> supprimerMembre(
        @PathVariable UUID compteId,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        membreService.suspendre(compteId, user.getCompteId());
        return ResponseEntity.noContent().build();
    }
}
