package com.solivio.api.inscription.infrastructure.web;

import com.solivio.api.identity.SolivioUserDetails;
import com.solivio.api.inscription.application.InscriptionService;
import com.solivio.api.inscription.infrastructure.web.dto.InscriptionPersonnelleResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/inscriptions/mes")
public class MesInscriptionsController {

    private final InscriptionService inscriptionService;

    public MesInscriptionsController(InscriptionService inscriptionService) {
        this.inscriptionService = inscriptionService;
    }

    @GetMapping
    public ResponseEntity<List<InscriptionPersonnelleResponse>> mesInscriptions(
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        return ResponseEntity.ok(inscriptionService.toutesInscriptions(user.getUsername()));
    }
}
