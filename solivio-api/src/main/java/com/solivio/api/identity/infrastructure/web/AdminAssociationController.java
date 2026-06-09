package com.solivio.api.identity.infrastructure.web;

import com.solivio.api.identity.application.AdminAssociationService;
import com.solivio.api.identity.infrastructure.security.SolivioUserDetails;
import com.solivio.api.identity.infrastructure.web.dto.AssociationAdminResponse;
import com.solivio.api.identity.infrastructure.web.dto.CreateAssociationRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/associations")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminAssociationController {

    private final AdminAssociationService adminAssociationService;

    public AdminAssociationController(AdminAssociationService adminAssociationService) {
        this.adminAssociationService = adminAssociationService;
    }

    @GetMapping
    public ResponseEntity<List<AssociationAdminResponse>> lister() {
        return ResponseEntity.ok(adminAssociationService.lister());
    }

    @PostMapping
    public ResponseEntity<AssociationAdminResponse> creer(
        @Valid @RequestBody CreateAssociationRequest request,
        @AuthenticationPrincipal SolivioUserDetails user
    ) {
        AssociationAdminResponse response = adminAssociationService.creer(request, user.getCompteId());
        return ResponseEntity.status(201).body(response);
    }
}
