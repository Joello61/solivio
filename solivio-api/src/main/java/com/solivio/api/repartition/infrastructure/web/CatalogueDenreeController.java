package com.solivio.api.repartition.infrastructure.web;

import com.solivio.api.identity.infrastructure.security.SolivioUserDetails;
import com.solivio.api.repartition.application.CatalogueDenreeService;
import com.solivio.api.repartition.infrastructure.web.dto.CatalogueDenreeRequest;
import com.solivio.api.repartition.infrastructure.web.dto.CatalogueDenreeResponse;
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
@RequestMapping("/api/denrees/catalogue")
public class CatalogueDenreeController {

    private final CatalogueDenreeService catalogueService;

    public CatalogueDenreeController(CatalogueDenreeService catalogueService) {
        this.catalogueService = catalogueService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('COORDINATEUR','RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<List<CatalogueDenreeResponse>> rechercher(
        @RequestParam(required = false, defaultValue = "") String q
    ) {
        return ResponseEntity.ok(catalogueService.rechercher(q));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<CatalogueDenreeResponse> creer(
        @Valid @RequestBody CatalogueDenreeRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(catalogueService.creer(request.libelle(), user.getCompteId()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<CatalogueDenreeResponse> modifier(
        @PathVariable UUID id,
        @Valid @RequestBody CatalogueDenreeRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        return ResponseEntity.ok(catalogueService.modifier(id, request.libelle(), user.getCompteId()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<Void> supprimer(
        @PathVariable UUID id,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        catalogueService.supprimer(id, user.getCompteId());
        return ResponseEntity.noContent().build();
    }
}
