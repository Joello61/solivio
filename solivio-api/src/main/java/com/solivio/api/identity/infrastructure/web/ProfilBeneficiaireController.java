package com.solivio.api.identity.infrastructure.web;

import com.solivio.api.identity.application.ProfilBeneficiaireService;
import com.solivio.api.identity.SolivioUserDetails;
import com.solivio.api.identity.infrastructure.web.dto.ProfilBeneficiaireResponse;
import com.solivio.api.identity.infrastructure.web.dto.UpdateProfilBeneficiaireRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me/profil-beneficiaire")
@PreAuthorize("hasRole('BENEFICIAIRE')")
public class ProfilBeneficiaireController {

    private final ProfilBeneficiaireService service;

    public ProfilBeneficiaireController(ProfilBeneficiaireService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ProfilBeneficiaireResponse> lire(
        @AuthenticationPrincipal SolivioUserDetails userDetails
    ) {
        return ResponseEntity.ok(service.lire(userDetails.getCompteId()));
    }

    @PutMapping
    public ResponseEntity<ProfilBeneficiaireResponse> mettreAJour(
        @Valid @RequestBody UpdateProfilBeneficiaireRequest request,
        @AuthenticationPrincipal SolivioUserDetails userDetails
    ) {
        return ResponseEntity.ok(service.mettreAJour(userDetails.getCompteId(), request));
    }
}
