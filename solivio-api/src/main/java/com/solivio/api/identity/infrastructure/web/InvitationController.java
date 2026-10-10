package com.solivio.api.identity.infrastructure.web;

import com.solivio.api.identity.application.InvitationService;
import com.solivio.api.identity.domain.Invitation;
import com.solivio.api.identity.SolivioUserDetails;
import com.solivio.api.identity.infrastructure.web.dto.InviterMembreRequest;
import com.solivio.api.shared.association.AssociationQueryPort;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/invitations")
public class InvitationController {

    private final InvitationService invitationService;
    private final AssociationQueryPort associationQueryPort;

    public InvitationController(InvitationService invitationService,
                                AssociationQueryPort associationQueryPort) {
        this.invitationService = invitationService;
        this.associationQueryPort = associationQueryPort;
    }

    @PostMapping
    @PreAuthorize("hasRole('RESPONSABLE')")
    public ResponseEntity<Map<String, String>> inviter(
            @Valid @RequestBody InviterMembreRequest request,
            @AuthenticationPrincipal SolivioUserDetails userDetails) {
        Invitation invitation = invitationService.inviter(
            userDetails, request.email(), request.role(), request.coordoType());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(Map.of("token", invitation.getToken().toString()));
    }

    @GetMapping("/{token}/details")
    public ResponseEntity<Map<String, String>> consulterInvitation(@PathVariable UUID token) {
        Invitation invitation = invitationService.consulterInvitation(token);
        return ResponseEntity.ok(Map.of(
            "email", invitation.getEmail(),
            "associationNom", associationQueryPort.nomAssociation(),
            "role", invitation.getRole()
        ));
    }
}
